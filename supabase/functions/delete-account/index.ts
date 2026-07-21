import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify user identity
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const anonymousId = "00000000-0000-0000-0000-000000000000";

    const retainUntil = new Date();
    retainUntil.setMonth(retainUntil.getMonth() + 6);

    // 데이터 정리 단계. 하나라도 실패하면 auth 유저를 남긴 채 중단한다 —
    // auth 유저를 먼저 지우면 사용자가 재로그인해 재시도할 방법이 없어지고,
    // 데이터는 남았는데 "삭제 완료"라고 통보한 상태가 된다.
    const steps: Array<[string, PromiseLike<{ error: unknown }>]> = [
      // 1) 시술 기록 익명화 (통계 자산으로 보존, 사용자 링크만 제거)
      ["treatment_records", adminClient
        .from("treatment_records")
        .update({ user_id: anonymousId, clinic_address: null, memo: null, notes: null })
        .eq("user_id", userId)],

      // 2) 시술 주기 익명화
      ["treatment_cycles", adminClient
        .from("treatment_cycles")
        .update({ user_id: anonymousId, notes: null })
        .eq("user_id", userId)],

      // 3) 결제 기록 익명화 — 6개월 보관 마커. 이후 스케줄 잡이 파기
      ["payment_records", adminClient
        .from("payment_records")
        .update({
          user_id: anonymousId,
          memo: `retain_until:${retainUntil.toISOString().split("T")[0]}`,
        })
        .eq("user_id", userId)],

      // 4) 포인트 거래 익명화
      ["point_transactions", adminClient
        .from("point_transactions")
        .update({ user_id: anonymousId })
        .eq("user_id", userId)],

      // 5) 사용자 전용 데이터 삭제
      //    diagnosis_snapshots·user_favorite_clinics는 user_profiles를 FK로
      //    ON DELETE CASCADE 걸려 있지만, 아래 6)에서 프로필 행을 지우지 않고
      //    남기므로 캐스케이드가 절대 안 터진다. 명시적으로 지워야 한다.
      ["reservations", adminClient.from("reservations").delete().eq("user_id", userId)],
      ["clinic_balances", adminClient.from("clinic_balances").delete().eq("user_id", userId)],
      ["treatment_packages", adminClient.from("treatment_packages").delete().eq("user_id", userId)],
      ["diagnosis_snapshots", adminClient.from("diagnosis_snapshots").delete().eq("user_id", userId)],
      ["user_favorite_clinics", adminClient.from("user_favorite_clinics").delete().eq("user_id", userId)],

      // 6) 프로필 PII 제거
      //    5축 진단(score_p~a)은 Data Safety에서 "건강" 범주로 신고하는 항목이라
      //    반드시 함께 지운다.
      ["user_profiles", adminClient
        .from("user_profiles")
        .update({
          name: null,
          email: null,
          birth_date: null,
          concerns: null,
          goals: null,
          regions: null,
          target_areas: null,
          skin_type: null,
          score_p: null,
          score_o: null,
          score_i: null,
          score_h: null,
          score_a: null,
          skin_tribe: null,
          current_season: null,
          diagnosis_updated_at: null,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", userId)],
    ];

    for (const [table, query] of steps) {
      const { error } = await query;
      if (error) {
        console.error(`delete-account: ${table} 단계 실패`, error);
        return new Response(
          JSON.stringify({ error: "Deletion incomplete" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // 7) 모든 데이터 단계가 성공한 뒤에만 auth 유저 삭제
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("Failed to delete auth user:", deleteError);
      return new Response(JSON.stringify({ error: "Failed to delete account" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("delete-account error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
