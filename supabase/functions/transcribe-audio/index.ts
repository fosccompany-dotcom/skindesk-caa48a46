import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing LOVABLE_API_KEY' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return new Response(JSON.stringify({ error: 'multipart/form-data required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const inForm = await req.formData();
    const file = inForm.get('file');
    if (!(file instanceof File) || file.size === 0) {
      return new Response(JSON.stringify({ error: '오디오 파일이 비어있습니다.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (file.size > 25 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: '파일 크기가 25MB를 초과합니다.' }), {
        status: 413,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Derive extension from MIME type (OpenAI infers format from filename)
    const mime = (file.type || '').split(';')[0];
    const extMap: Record<string, string> = {
      'audio/webm': 'webm',
      'audio/mp4': 'mp4',
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/wav': 'wav',
      'audio/x-wav': 'wav',
      'audio/ogg': 'ogg',
      'audio/m4a': 'm4a',
    };
    const ext = extMap[mime] || 'webm';

    const upstream = new FormData();
    upstream.append('model', 'openai/gpt-4o-mini-transcribe');
    upstream.append('file', file, `recording.${ext}`);
    // language hint: Korean primary, but let model auto-detect for mixed content
    upstream.append('language', 'ko');

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstream,
    });

    const respText = await resp.text();
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: `STT 실패: ${resp.status}`, detail: respText }), {
        status: resp.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let parsed: any = {};
    try { parsed = JSON.parse(respText); } catch { parsed = { text: respText }; }

    return new Response(JSON.stringify({ text: parsed.text || '' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
