import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ── Auth gate: require a logged-in user (prevents anonymous STT cost abuse) ──
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authError } = await authClient.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
    // 언어 모드에 맞춰 인식 언어 지정 (ISO-639-1)
    const langRaw = (inForm.get('language')?.toString() || '').toLowerCase();
    const langMap: Record<string, string> = { ko: 'ko', en: 'en', zh: 'zh' };
    const lang = langMap[langRaw];
    if (lang) upstream.append('language', lang);
    // 미지정 시 자동 감지

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
