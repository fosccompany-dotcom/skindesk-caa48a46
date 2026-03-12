import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Sparkles, Info, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  ALL_TREATMENT_SEASON_DATA,
  SEASON_META,
  CATEGORY_ORDER,
  SeasonKey,
  TreatmentSeasonData,
} from '@/data/treatmentSeasonData';
import { useNavigate } from 'react-router-dom';

// ─── 모드 배지 컬러 ───────────────────────────────────────────────────────────
const SEASON_BADGE: Record<SeasonKey, string> = {
  reset:    'bg-green-100 text-green-700 border-green-200',
  recovery: 'bg-sky-100 text-sky-700 border-sky-200',
  maintain: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  boost:    'bg-amber-100 text-amber-700 border-amber-200',
  special:  'bg-purple-100 text-purple-700 border-purple-200',
};

// ─── 카테고리 아이콘 ──────────────────────────────────────────────────────────
const CATEGORY_EMOJI: Record<string, string> = {
  '리프팅':    '🔺',
  '보톡스/필러': '💉',
  '주사':      '💊',
  '레이저':    '✨',
  '스킨케어':  '🧴',
  '기기':      '🔬',
};

// ─── 추천 강도 컬러 ───────────────────────────────────────────────────────────
function getRecColor(timesPerYear: number) {
  if (timesPerYear === 0) return 'text-gray-400';
  if (timesPerYear <= 2)  return 'text-indigo-600';
  if (timesPerYear <= 6)  return 'text-amber-600';
  return 'text-rose-500';
}

// ─── 단일 시술 카드 ───────────────────────────────────────────────────────────
function TreatmentCard({
  data,
  season,
  defaultOpen = false,
}: {
  data: TreatmentSeasonData;
  season: SeasonKey;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const rec = data.seasons[season];
  const isNotRec = rec.timesPerYear === 0;

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-all ${
        isNotRec
          ? 'border-gray-100 bg-gray-50 opacity-60'
          : 'border-gray-200 bg-white'
      }`}
    >
      {/* 카드 헤더 */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={() => setOpen(!open)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-gray-800">{data.name}</span>
            <span className="text-[10px] text-gray-400">{CATEGORY_EMOJI[data.category]} {data.category}</span>
          </div>
          <p className={`text-xs font-semibold mt-0.5 ${isNotRec ? 'text-gray-400' : getRecColor(rec.timesPerYear)}`}>
            {rec.label}
          </p>
        </div>
        {/* 연간 횟수 뱃지 */}
        {!isNotRec && (
          <div className="shrink-0 text-center">
            <p className={`text-lg font-black ${getRecColor(rec.timesPerYear)}`}>{rec.timesPerYear}</p>
            <p className="text-[9px] text-gray-400 leading-tight">회/년</p>
          </div>
        )}
        {isNotRec && (
          <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 border border-gray-200">
            비추천
          </span>
        )}
        <div className="text-gray-300 shrink-0">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {/* 상세 펼침 */}
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
          {/* 기본 설명 */}
          <p className="text-[11px] text-gray-500 leading-relaxed">{data.description}</p>

          {/* 권장 내용 */}
          <div className={`rounded-xl px-3 py-2.5 ${isNotRec ? 'bg-gray-100' : 'bg-gray-50'}`}>
            <p className="text-[11px] text-gray-600 leading-relaxed">{rec.note}</p>
          </div>

          {/* 시너지 추천 */}
          {rec.synergy && rec.synergy.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 mb-1.5 flex items-center gap-1">
                <Sparkles size={10} className="text-amber-400" />
                함께하면 효과적인 시술
              </p>
              <div className="flex flex-wrap gap-1.5">
                {rec.synergy.map((s) => (
                  <span
                    key={s}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200"
                  >
                    + {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 모든 모드 비교 (접기) */}
          <AllSeasonCompare data={data} currentSeason={season} />
        </div>
      )}
    </div>
  );
}

// ─── 5개 모드 가로 비교 ───────────────────────────────────────────────────────
function AllSeasonCompare({ data, currentSeason }: { data: TreatmentSeasonData; currentSeason: SeasonKey }) {
  const [show, setShow] = useState(false);
  const seasons: SeasonKey[] = ['reset', 'recovery', 'maintain', 'boost', 'special'];

  return (
    <div>
      <button
        onClick={() => setShow(!show)}
        className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600"
      >
        <Info size={10} />
        {show ? '모드별 비교 닫기' : '5모드 모두 보기'}
      </button>

      {show && (
        <div className="mt-2 rounded-xl border border-gray-100 overflow-hidden">
          {seasons.map((sk) => {
            const r = data.seasons[sk];
            const meta = SEASON_META[sk];
            const isCurrent = sk === currentSeason;
            return (
              <div
                key={sk}
                className={`flex items-center gap-2 px-3 py-2 border-b border-gray-50 last:border-b-0 ${
                  isCurrent ? 'bg-gray-50' : ''
                }`}
              >
                <span className="text-sm shrink-0">{meta.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-[10px] font-semibold ${meta.color}`}>{meta.sub}</p>
                  <p className="text-[10px] text-gray-500 truncate">{r.label}</p>
                </div>
                {isCurrent && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-500 shrink-0">
                    현재
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── 메인 모드 추천 컴포넌트 ──────────────────────────────────────────────────
export default function SeasonRecommendation() {
  const navigate = useNavigate();
  const [season, setSeason] = useState<SeasonKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [showNotRec, setShowNotRec] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from('user_profiles')
        .select('current_season' as any)
        .eq('id', user.id)
        .single();
      if ((data as any)?.current_season) setSeason((data as any).current_season as SeasonKey);
      setLoading(false);
    };
    load();
  }, []);

  // ── 모드 미설정 안내 ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!season) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
        <span className="text-4xl">🌿</span>
        <div>
          <p className="text-sm font-bold text-gray-700">관리 모드를 먼저 설정해주세요</p>
          <p className="text-xs text-gray-400 mt-1">
            마이페이지 → 기본정보에서 현재 모드를 선택하면<br />
            맞춤 시술 주기 추천을 받을 수 있어요.
          </p>
        </div>
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gray-800 text-white text-xs font-semibold"
        >
          모드 설정하기 <ArrowRight size={12} />
        </button>
      </div>
    );
  }

  const meta = SEASON_META[season];
  const categories = ['전체', ...CATEGORY_ORDER];

  // 필터링
  const filtered = ALL_TREATMENT_SEASON_DATA.filter((d) => {
    const catOk = selectedCategory === '전체' || d.category === selectedCategory;
    const recOk = showNotRec || d.seasons[season].timesPerYear > 0;
    return catOk && recOk;
  });

  // 카테고리별 그룹
  const grouped = CATEGORY_ORDER.reduce<Record<string, TreatmentSeasonData[]>>((acc, cat) => {
    const items = filtered.filter((d) => d.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* 현재 모드 헤더 */}
      <div className={`rounded-2xl border px-4 py-3.5 flex items-center gap-3 ${meta.bg} ${meta.border}`}>
        <span className="text-2xl shrink-0">{meta.emoji}</span>
        <div>
          <p className="text-[10px] text-gray-400 font-medium">현재 나의 관리 모드</p>
          <p className={`text-sm font-black ${meta.color}`}>{meta.title}</p>
          <p className="text-xs text-gray-500">{meta.sub}</p>
        </div>
        <button
          onClick={() => navigate('/profile')}
          className="ml-auto shrink-0 text-[10px] px-2.5 py-1 rounded-full border border-gray-200 bg-white text-gray-500"
        >
          변경
        </button>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`shrink-0 text-[11px] px-3 py-1.5 rounded-full border transition-all ${
              selectedCategory === cat
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-500 border-gray-200'
            }`}
          >
            {cat !== '전체' && CATEGORY_EMOJI[cat]} {cat}
          </button>
        ))}
      </div>

      {/* 비추천 토글 */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {season && `${meta.sub} 기준 · `}
          <span className="font-semibold text-gray-600">{filtered.length}개 시술</span>
        </p>
        <button
          onClick={() => setShowNotRec(!showNotRec)}
          className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
            showNotRec
              ? 'bg-gray-100 text-gray-500 border-gray-200'
              : 'bg-white text-gray-400 border-gray-200'
          }`}
        >
          비추천 포함 {showNotRec ? '✓' : ''}
        </button>
      </div>

      {/* 카테고리별 시술 목록 */}
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">{CATEGORY_EMOJI[cat]}</span>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">{cat}</h3>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
          {items.map((item) => (
            <TreatmentCard
              key={item.id}
              data={item}
              season={season}
            />
          ))}
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          해당 카테고리에 표시할 시술이 없습니다.
        </div>
      )}

      {/* 하단 안내 */}
      <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 text-[10px] text-gray-400 leading-relaxed">
        💡 추천 주기는 일반적인 가이드라인입니다. 개인의 피부 상태와 의사 소견에 따라 조정하세요.
        모드를 변경하면 추천 내용이 달라집니다.
      </div>
    </div>
  );
}
