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

    // 1) Anonymize treatment_records (keep data, remove user link)
    await adminClient
      .from("treatment_records")
      .update({
        user_id: anonymousId,
        clinic_address: null,
        memo: null,
        notes: null,
      })
      .eq("user_id", userId);

    // 2) Anonymize treatment_cycles
    await adminClient
      .from("treatment_cycles")
      .update({ user_id: anonymousId, notes: null })
      .eq("user_id", userId);

    // 3) Anonymize payment_records — retain for 6 months (set deleted_at marker via memo)
    //    Records stay with anonymized user_id; a scheduled job can purge after 6 months
    const retainUntil = new Date();
    retainUntil.setMonth(retainUntil.getMonth() + 6);
    await adminClient
      .from("payment_records")
      .update({
        user_id: anonymousId,
        memo: `retain_until:${retainUntil.toISOString().split("T")[0]}`,
      })
      .eq("user_id", userId);

    // 4) Anonymize point_transactions
    await adminClient
      .from("point_transactions")
      .update({ user_id: anonymousId })
      .eq("user_id", userId);

    // 5) Delete non-essential user-specific data
    const deleteTables = [
      "reservations",
      "clinic_balances",
      "treatment_packages",
    ];
    for (const table of deleteTables) {
      await adminClient.from(table).delete().eq("user_id", userId);
    }

    // 6) Mark profile as deleted (anonymize PII)
    await adminClient
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
        deleted_at: new Date().toISOString(),
      })
      .eq("id", userId);

    // 7) Delete auth user
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
