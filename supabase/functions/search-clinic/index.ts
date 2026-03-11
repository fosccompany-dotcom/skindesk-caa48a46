import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const KAKAO_REST_API_KEY = Deno.env.get("KAKAO_REST_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const query = url.searchParams.get("query");

  if (!query) {
    return new Response(JSON.stringify({ places: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const kakaoUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&category_group_code=HP8&size=10`;
    const res = await fetch(kakaoUrl, {
      headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` },
    });
    const data = await res.json();

    const places = (data.documents || []).map((d: any) => ({
      name: d.place_name,
      address: d.address_name,
      road_address: d.road_address_name || null,
      phone: d.phone || null,
      category: d.category_name || null,
      kakao_id: d.id || null,
    }));

    return new Response(JSON.stringify({ places }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ places: [], error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
