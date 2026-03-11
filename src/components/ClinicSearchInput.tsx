import { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ClinicPlace {
  name: string;
  address: string;
  phone?: string;
  category?: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  darkMode?: boolean; // ParseTreatmentModal은 dark bg
}

export default function ClinicSearchInput({ value, onChange, placeholder = '병원명 검색', className = '', darkMode = false }: Props) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<ClinicPlace[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // 상위 value 변경 시 동기화
  useEffect(() => { setQuery(value); }, [value]);

  const search = async (q: string) => {
    if (!q.trim() || q.trim().length < 1) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-clinic', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: null,
      });
      // Edge Function은 GET이므로 URL params 방식으로 호출
      const url = `${(supabase as any).supabaseUrl}/functions/v1/search-clinic?query=${encodeURIComponent(q)}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token ?? ''}`,
          apikey: (supabase as any).supabaseKey ?? '',
        },
      });
      const json = await res.json();
      setResults(json.places ?? []);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (val: string) => {
    setQuery(val);
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 350);
  };

  const select = (place: ClinicPlace) => {
    setQuery(place.name);
    onChange(place.name);
    setOpen(false);
    setResults([]);
  };

  const clear = () => {
    setQuery('');
    onChange('');
    setResults([]);
    setOpen(false);
  };

  const base = darkMode
    ? 'bg-white/8 border border-white/15 text-white placeholder:text-white/30 rounded-xl px-3 py-2.5 text-sm w-full focus:outline-none focus:border-[#C9A96E]/60'
    : 'border border-input bg-background text-foreground placeholder:text-muted-foreground rounded-xl px-3 py-2.5 text-sm w-full focus:outline-none focus:border-[#C9A96E]/60';

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${darkMode ? 'text-white/30' : 'text-muted-foreground'}`} />
        <input
          className={`${base} pl-8 pr-8`}
          value={query}
          onChange={e => handleInput(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
        />
        {query && (
          <button onClick={clear} className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className={`absolute top-full left-0 right-0 mt-1 z-50 rounded-xl shadow-xl overflow-hidden border max-h-52 overflow-y-auto ${
          darkMode ? 'bg-[#1a1a1a] border-white/15' : 'bg-popover border-border'
        }`}>
          {results.map((p, i) => (
            <button
              key={i}
              className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition-colors ${
                darkMode
                  ? 'hover:bg-white/8 border-b border-white/8 last:border-0'
                  : 'hover:bg-muted border-b border-border last:border-0'
              }`}
              onClick={() => select(p)}
            >
              <MapPin className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${darkMode ? 'text-[#C9A96E]' : 'text-primary'}`} />
              <div className="min-w-0">
                <p className={`text-sm font-semibold truncate ${darkMode ? 'text-white' : 'text-foreground'}`}>{p.name}</p>
                {p.address && (
                  <p className={`text-[10px] truncate mt-0.5 ${darkMode ? 'text-white/40' : 'text-muted-foreground'}`}>{p.address}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {open && loading && (
        <div className={`absolute top-full left-0 right-0 mt-1 z-50 rounded-xl border px-3 py-3 text-xs text-center ${
          darkMode ? 'bg-[#1a1a1a] border-white/15 text-white/40' : 'bg-popover border-border text-muted-foreground'
        }`}>
          검색 중...
        </div>
      )}
    </div>
  );
}
