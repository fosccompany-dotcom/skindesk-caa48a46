// ============================================================================
// parse-clinic-event Edge Function
// ----------------------------------------------------------------------------
// POST /functions/v1/parse-clinic-event
//
// 입력 (JSON body):
//   {
//     location_id:   string,              // 필수 — clinic_locations.id
//     source_type:   'kakao'|'sms'|'homepage'|'manual',
//     raw_message?:  string,              // 카톡/SMS 본문 (선택)
//     image_url?:    string,              // 배너 이미지 URL (선택, 비전 분석)
//     image_base64?: string,              // 이미지 base64 (선택, image_url 우선)
//     image_type?:   string,              // 'image/jpeg' 등 (image_base64일 때)
//     source_url?:   string,              // 출처 URL
//     dry_run?:      boolean              // true면 DB 저장 안 하고 파싱 결과만 반환
//   }
//
// 처리:
//   1. brand_id 자동 도출 (location_id → clinic_locations.brand_id)
//   2. Lovable AI Gateway에 텍스트+이미지 보내 구조화 JSON 추출
//   3. clinic_events INSERT (캠페인 단위)
//   4. clinic_treatments 일괄 INSERT (시술 단위, event_id 연결)
//   5. 결과 반환 (event_id, treatment_count, confidence_score 등)
//
// 환경변수:
//   LOVABLE_API_KEY            — Lovable AI Gateway 키
//   SUPABASE_URL               — 자동 제공
//   SUPABASE_SERVICE_ROLE_KEY  — 자동 제공
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ---------------------------------------------------------------------------
// 시스템 프롬프트 — 핵심: 시술 단위 분리, X or Y 자동 분리
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `당신은 한국 피부과/성형외과 이벤트 메시지·배너 이미지에서 시술 정보를 정확히 추출하는 전문가입니다.

입력은 카카오톡 채널 메시지, SMS, 또는 클리닉 이벤트 배너 이미지일 수 있습니다.

다음 두 가지를 추출하세요:

[1] 캠페인 (campaign) — 메시지/이미지 전체의 메타데이터
  - title: 캠페인 대표 제목 (예: "가정의 달 1회 체험가 마감임박")
  - description: 1-2줄 요약
  - notice_type: 'event' (이벤트/프로모션) / 'schedule' (영업·휴진 안내) / 'other'
  - start_date: 이벤트 시작일 YYYY-MM-DD (명시 없으면 null)
  - end_date: 이벤트 종료일 YYYY-MM-DD (명시 없으면 null)
  - hours_text: 영업시간 텍스트 (schedule 타입일 때, 예: "평일 09:00~20:00")
  - is_closed: 휴진 여부 (schedule + 휴진일 때 true)
  - confidence_score: 0-100 추출 신뢰도 (텍스트 명확성, 가격 추출 완성도, 기간 명시 등을 고려)

[2] 시술 리스트 (treatments) — 시술/패키지 단위로 1개씩 분리된 배열
  각 시술은 아래 필드:
  - treatment_name: 시술명 (예: "리쥬란힐러 2cc", "젠틀맥스 1년 무제한 남성 인증")
  - category: 시술 카테고리 (예: '스킨부스터','리프팅','보톡스','제모','필러','레이저','점제거','지방주사','관리','반영구메이크업','수액','주사','토닝','다이어트','성형','패키지','기타')
  - price_krw: 이벤트가 (원, 정수)
  - original_price_krw: 정상가 (원, 정수, 없으면 null)
  - price_unit: 'session'(1회) / 'shot'(샷) / 'package'(패키지) / 'experience'(체험가) / 'subscription'(구독·무제한)
  - session_count: 횟수 (1=단일, N=N회 패키지, 무제한이면 null)
  - is_unlimited: true/false (1년 무제한 등)
  - bundle_size: 1=단일, 2=1+1, 3=1+2 등 번들 크기
  - combo_items: 조합 시술명 배열 (예: ["리투오 1vial","리쥬란 4cc"]), 단일이면 null
  - conditions: 조건 텍스트 (예: "구글리뷰조건/카카오톡 플친/VAT별도", 없으면 null)
  - body_areas: 부위 배열 (예: ["겨드랑이"], ["눈썹","아이라인"])
  - description: 시술 설명 (선택)

★ 매우 중요한 규칙 ★
1. "X or Y" 형태로 두 부위/시술이 묶인 경우 반드시 2개 row로 분리 (예: "남성 인증 or 겨드랑이" → "남성 인증" + "남성 겨드랑이" 각 1 row).
2. "+" 또는 "AND"로 조합된 시술은 1 row 유지 + combo_items로 표시 (예: "리투오 + 리쥬란" → combo_items: ["리투오","리쥬란"]).
3. "1+1" 같은 번들은 1 row + bundle_size=2.
4. "N회 패키지"는 1 row + session_count=N + price_unit='package'.
5. "1년 무제한" / "자유이용권"은 is_unlimited=true.
6. 가격은 원화 숫자(정수)로. "9.9만원" → 99000. "29,000원" → 29000.
7. 카탈로그성 이미지(가격이 많이 나열된 메인 배너)는 모든 시술을 빠짐없이 추출.
8. 영업공지 이미지는 treatments는 빈 배열, notice_type='schedule'.
9. 시술이 너무 많아도 빠짐없이 추출 (50개 이상 가능).`;

// ---------------------------------------------------------------------------
// Tool 스키마 — 구조화된 JSON 추출용
// ---------------------------------------------------------------------------
const TOOL_SCHEMA = {
  type: "function" as const,
  function: {
    name: "extract_clinic_event",
    description: "Korean clinic event message/image에서 캠페인 메타 + 시술 리스트를 추출",
    parameters: {
      type: "object",
      properties: {
        campaign: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: ["string", "null"] },
            notice_type: { type: "string", enum: ["event", "schedule", "other"] },
            start_date: { type: ["string", "null"], description: "YYYY-MM-DD" },
            end_date: { type: ["string", "null"], description: "YYYY-MM-DD" },
            hours_text: { type: ["string", "null"] },
            is_closed: { type: "boolean" },
            confidence_score: { type: "integer", minimum: 0, maximum: 100 },
          },
          required: ["title", "notice_type", "confidence_score", "is_closed"],
        },
        treatments: {
          type: "array",
          items: {
            type: "object",
            properties: {
              treatment_name: { type: "string" },
              category: { type: "string" },
              price_krw: { type: ["integer", "null"] },
              original_price_krw: { type: ["integer", "null"] },
              price_unit: {
                type: "string",
                enum: ["session", "shot", "package", "experience", "subscription"],
              },
              session_count: { type: ["integer", "null"] },
              is_unlimited: { type: "boolean" },
              bundle_size: { type: "integer", minimum: 1 },
              combo_items: {
                type: ["array", "null"],
                items: { type: "string" },
              },
              conditions: { type: ["string", "null"] },
              body_areas: { type: "array", items: { type: "string" } },
              description: { type: ["string", "null"] },
            },
            required: ["treatment_name", "is_unlimited", "bundle_size"],
          },
        },
      },
      required: ["campaign", "treatments"],
    },
  },
};

// ---------------------------------------------------------------------------
// 메인 핸들러
// ---------------------------------------------------------------------------
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      location_id,
      source_type = "manual",
      raw_message,
      image_url,
      image_base64,
      image_type = "image/jpeg",
      source_url,
      dry_run = false,
    } = body;

    if (!location_id) {
      return jsonResponse({ error: "location_id 필수" }, 400);
    }
    if (!raw_message && !image_url && !image_base64) {
      return jsonResponse(
        { error: "raw_message / image_url / image_base64 중 최소 1개 필요" },
        400,
      );
    }

    // Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // brand_id 자동 도출
    const { data: loc, error: locErr } = await supabase
      .from("clinic_locations")
      .select("brand_id")
      .eq("id", location_id)
      .single();
    if (locErr || !loc) {
      return jsonResponse({ error: "location_id 조회 실패: " + (locErr?.message || "not found") }, 404);
    }
    const brand_id = loc.brand_id;

    // 이 브랜드의 glossary (정정 학습 데이터) 조회 — in-context learning용
    let glossarySection = "";
    if (brand_id) {
      const { data: glossary } = await supabase.rpc("get_brand_glossary" as any, {
        p_brand_id: brand_id,
        p_limit: 30,
      });
      if (glossary && Array.isArray(glossary) && glossary.length > 0) {
        const lines = (glossary as any[]).map(
          (g) => `  - [${g.field}] "${g.term}" → "${g.canonical}" (${g.usage_count}회)`,
        );
        glossarySection = `

★ 이 브랜드의 알려진 정정 패턴 (어드민이 과거 반려/수정한 사례, 반드시 반영) ★
${lines.join("\n")}

위 패턴이 raw_message나 이미지에 나타나면 자동으로 canonical 값으로 추출하세요.`;
      }
    }

    // 이미지 URL이면 다운로드해서 base64
    let finalImageBase64 = image_base64;
    let finalImageType = image_type;
    if (image_url && !image_base64) {
      const imgRes = await fetch(image_url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; BloomLogBot/1.0)",
          "Referer": image_url.replace(/\/upload\/.*$/, "/web/event"),
        },
      });
      if (!imgRes.ok) {
        return jsonResponse(
          { error: `이미지 다운로드 실패: ${imgRes.status} ${image_url}` },
          400,
        );
      }
      finalImageType = imgRes.headers.get("content-type") || "image/jpeg";
      const buf = new Uint8Array(await imgRes.arrayBuffer());
      // Base64 인코딩
      let binary = "";
      for (let i = 0; i < buf.byteLength; i++) binary += String.fromCharCode(buf[i]);
      finalImageBase64 = btoa(binary);
    }

    // LLM 호출 (Lovable AI Gateway)
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return jsonResponse({ error: "LOVABLE_API_KEY 미설정" }, 500);
    }

    const userContent: any[] = [];
    if (finalImageBase64) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:${finalImageType};base64,${finalImageBase64}`,
        },
      });
    }
    if (raw_message) {
      userContent.push({ type: "text", text: raw_message });
    }

    const llmRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Gemini Flash 우선 (속도·비용). 품질 부족 시 anthropic/claude-sonnet-4로 전환.
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + glossarySection },
          { role: "user", content: userContent },
        ],
        tools: [TOOL_SCHEMA],
        tool_choice: { type: "function", function: { name: "extract_clinic_event" } },
      }),
    });

    if (!llmRes.ok) {
      const errText = await llmRes.text();
      console.error("LLM gateway error:", llmRes.status, errText);
      if (llmRes.status === 429) {
        return jsonResponse({ error: "요청이 너무 많습니다." }, 429);
      }
      if (llmRes.status === 402) {
        return jsonResponse({ error: "AI 크레딧 부족" }, 402);
      }
      return jsonResponse({ error: "LLM 분석 오류", details: errText.substring(0, 500) }, 500);
    }

    const result = await llmRes.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return jsonResponse({ error: "파싱 결과 없음", raw: result }, 500);
    }

    let parsed: { campaign: any; treatments: any[] };
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      return jsonResponse({ error: "JSON 파싱 실패: " + (e as Error).message }, 500);
    }

    const { campaign, treatments } = parsed;

    // ---------------------------------------------------------------
    // Dry run: 저장 안 하고 파싱 결과만 반환
    // ---------------------------------------------------------------
    if (dry_run) {
      return jsonResponse({
        dry_run: true,
        campaign,
        treatment_count: treatments?.length || 0,
        treatments,
      });
    }

    // ---------------------------------------------------------------
    // INSERT clinic_events
    // ---------------------------------------------------------------
    const eventRow = {
      location_id,
      brand_id,
      title: campaign.title || "(제목 없음)",
      description: campaign.description || null,
      raw_message: raw_message || null,
      image_url: image_url || null,
      source_url: source_url || image_url || null,
      source_type,
      start_date: campaign.start_date || new Date().toISOString().slice(0, 10),
      end_date: campaign.end_date || null,
      notice_type: campaign.notice_type || "event",
      hours_text: campaign.hours_text || null,
      is_closed: campaign.is_closed === true,
      confidence_score: campaign.confidence_score ?? null,
      // review_status는 트리거가 자동 처리 (confidence>=80 → approved)
    };

    const { data: insertedEvent, error: eventErr } = await supabase
      .from("clinic_events")
      .insert(eventRow)
      .select("id, review_status, is_published")
      .single();

    if (eventErr || !insertedEvent) {
      console.error("clinic_events INSERT 실패:", eventErr);
      return jsonResponse({ error: "이벤트 저장 실패: " + (eventErr?.message || "unknown") }, 500);
    }

    const event_id = insertedEvent.id;

    // ---------------------------------------------------------------
    // INSERT clinic_treatments (event_id 연결)
    // ---------------------------------------------------------------
    let treatmentInsertCount = 0;
    let treatmentErrors: string[] = [];

    if (treatments && treatments.length > 0) {
      const tRows = treatments.map((t: any) => ({
        event_id,
        location_id,
        brand_id,
        treatment_name: t.treatment_name,
        category: t.category || null,
        price_krw: t.price_krw ?? null,
        original_price_krw: t.original_price_krw ?? null,
        discount_pct:
          t.original_price_krw && t.price_krw
            ? Math.round((1 - t.price_krw / t.original_price_krw) * 100)
            : null,
        price_unit: t.price_unit || "session",
        session_count: t.session_count ?? null,
        is_unlimited: t.is_unlimited === true,
        bundle_size: t.bundle_size || 1,
        combo_items: t.combo_items || null,
        conditions: t.conditions || null,
        body_areas: t.body_areas || [],
        effects: [],
        description: t.description || null,
        raw_text: raw_message ? raw_message.substring(0, 500) : null,
        source_url: source_url || image_url || null,
        source_type,
        effective_from: campaign.start_date || new Date().toISOString().slice(0, 10),
        effective_to: campaign.end_date || null,
      }));

      const { error: tErr, count: tCount } = await supabase
        .from("clinic_treatments")
        .insert(tRows, { count: "exact" });

      if (tErr) {
        console.error("clinic_treatments INSERT 실패:", tErr);
        treatmentErrors.push(tErr.message);
      } else {
        treatmentInsertCount = tCount || tRows.length;
      }
    }

    return jsonResponse({
      success: true,
      event_id,
      review_status: insertedEvent.review_status,
      is_published: insertedEvent.is_published,
      confidence_score: campaign.confidence_score,
      notice_type: campaign.notice_type,
      treatment_count: treatmentInsertCount,
      treatment_errors: treatmentErrors.length > 0 ? treatmentErrors : undefined,
      title: campaign.title,
    });
  } catch (err) {
    console.error("Unhandled error:", err);
    return jsonResponse(
      { error: "서버 오류: " + (err as Error).message },
      500,
    );
  }
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
