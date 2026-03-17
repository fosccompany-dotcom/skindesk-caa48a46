import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a Korean dermatology/skin clinic data extractor.
Given text or an image (KakaoTalk chat screenshot, clinic receipt, etc.), extract ALL of the following:

1. **records** – individual treatments performed.
2. **bundles** – grouped treatment sessions (e.g. "밴스 50분 코스").
3. **charges** – money deposited / charged (포인트 충전).
4. **packages** – treatment packages with session counts (e.g. "베이직 패키지 5-3회차" means 5 total, used 3).
5. **balance** – remaining balance at the clinic (잔여금액 / 남은 포인트 등).
6. **is_remaining_context** – true if the message is about "remaining" treatments/balance the customer still has (남아계신 관리, 남은 시술 등).

Important rules:
- For "남아계신 관리" context: items listed are REMAINING sessions, not completed ones.
- Dates: use YYYY-MM-DD format. If no date, use null.
- Clinic name: extract from context (e.g. "필로의원").
- Balance: extract numeric amount (e.g. "잔여금액 387,820원" → 387820).
- If the text mentions "N회" for remaining treatments, that's the remaining count.`;

const TOOL_SCHEMA = {
  type: "function" as const,
  function: {
    name: "extract_treatment_data",
    description: "Extract structured treatment data from Korean clinic text/image",
    parameters: {
      type: "object",
      properties: {
        records: {
          type: "array",
          items: {
            type: "object",
            properties: {
              date: { type: ["string", "null"], description: "YYYY-MM-DD or null" },
              treatmentName: { type: "string" },
              clinic: { type: ["string", "null"] },
              amount_paid: { type: ["number", "null"] },
              skinLayer: { type: "string", enum: ["epidermis", "dermis", "subcutaneous"] },
              bodyArea: { type: "string", enum: ["face", "neck", "body", "scalp", "other"] },
              memo: { type: ["string", "null"] },
            },
            required: ["treatmentName", "skinLayer", "bodyArea"],
            additionalProperties: false,
          },
        },
        bundles: {
          type: "array",
          items: {
            type: "object",
            properties: {
              date: { type: ["string", "null"] },
              bundleName: { type: "string" },
              clinic: { type: ["string", "null"] },
              amount_paid: { type: ["number", "null"] },
              memo: { type: ["string", "null"] },
              treatments: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    date: { type: ["string", "null"] },
                    treatmentName: { type: "string" },
                    clinic: { type: ["string", "null"] },
                    skinLayer: { type: "string", enum: ["epidermis", "dermis", "subcutaneous"] },
                    bodyArea: { type: "string", enum: ["face", "neck", "body", "scalp", "other"] },
                    memo: { type: ["string", "null"] },
                  },
                  required: ["treatmentName", "skinLayer", "bodyArea"],
                  additionalProperties: false,
                },
              },
            },
            required: ["bundleName", "treatments"],
            additionalProperties: false,
          },
        },
        charges: {
          type: "array",
          items: {
            type: "object",
            properties: {
              date: { type: ["string", "null"] },
              amount: { type: "number" },
              clinic: { type: ["string", "null"] },
              label: { type: "string" },
            },
            required: ["amount", "label"],
            additionalProperties: false,
          },
        },
        packages: {
          type: "array",
          items: {
            type: "object",
            properties: {
              date: { type: ["string", "null"] },
              name: { type: "string" },
              total_sessions: { type: "number" },
              used_sessions: { type: "number" },
              clinic: { type: ["string", "null"] },
              amount_paid: { type: ["number", "null"] },
              memo: { type: ["string", "null"] },
            },
            required: ["name", "total_sessions", "used_sessions"],
            additionalProperties: false,
          },
        },
        balance: {
          type: ["object", "null"],
          description: "Remaining balance at the clinic if mentioned",
          properties: {
            amount: { type: "number", description: "Balance amount in KRW" },
            clinic: { type: ["string", "null"] },
          },
          required: ["amount"],
          additionalProperties: false,
        },
        is_remaining_context: {
          type: "boolean",
          description: "True if the message is about remaining/leftover treatments the customer still has",
        },
      },
      required: ["records", "bundles", "charges", "packages", "balance", "is_remaining_context"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { text, image_base64, image_type } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build user message content
    const userContent: any[] = [];
    if (image_base64) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:${image_type || "image/jpeg"};base64,${image_base64}`,
        },
      });
    }
    if (text) {
      userContent.push({ type: "text", text });
    }
    if (userContent.length === 0) {
      return new Response(JSON.stringify({ error: "텍스트 또는 이미지를 입력해주세요." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent.length === 1 && typeof userContent[0] === "object" && userContent[0].type === "text"
            ? userContent[0].text
            : userContent
          },
        ],
        tools: [TOOL_SCHEMA],
        tool_choice: { type: "function", function: { name: "extract_treatment_data" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI 크레딧이 부족합니다." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI 분석 오류가 발생했습니다." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      // Fallback: try to parse from content
      console.error("No tool call in response:", JSON.stringify(result));
      return new Response(JSON.stringify({
        records: [], bundles: [], charges: [], packages: [],
        balance: null, is_remaining_context: false,
        source: "gemini",
        error: "시술 정보를 찾지 못했습니다.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({
      records: parsed.records || [],
      bundles: parsed.bundles || [],
      charges: parsed.charges || [],
      packages: parsed.packages || [],
      balance: parsed.balance || null,
      is_remaining_context: parsed.is_remaining_context || false,
      source: "gemini",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-treatment error:", e);
    return new Response(JSON.stringify({
      error: e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
