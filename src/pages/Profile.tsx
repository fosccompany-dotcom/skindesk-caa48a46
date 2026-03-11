import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useRecords } from '@/context/RecordsContext';
import AddPaymentModal from '@/components/AddPaymentModal';
import { SkinType, BodyArea, BODY_AREA_LABELS, SKIN_LAYER_LABELS } from '@/types/skin';
import { User, Target, AlertCircle, MapPin, Navigation, X, ClipboardList, CreditCard, Star, ChevronDown, ChevronUp, Globe, LogOut, Plus, Trash2, Pencil, Check } from 'lucide-react';
import logoImg from '@/assets/logo.png';
import { format, differenceInYears } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';
import { Language, LANGUAGE_LABELS } from '@/i18n/translations';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const skinTypes: SkinType[] = ['건성', '지성', '복합성', '민감성', '중성'];
const concernOptions = ['모공', '색소침착', '탄력저하', '주름', '여드름', '홍조', '건조', '다크서클', '제모', '셀룰라이트', '튼살'];
const goalOptions = ['맑은 피부톤', '모공 축소', '탄력 개선', '주름 개선', '트러블 완화', '보습 강화', '바디라인 정리', '제모 완료'];
const bodyAreaOptions: BodyArea[] = ['face', 'neck', 'arm', 'leg', 'abdomen', 'back', 'chest', 'hip'];

const REGION_DATA: Record<string, Record<string, string[]>> = {
  '서울특별시': {
    '강남구': ['역삼동', '삼성동', '논현동', '청담동', '압구정동', '신사동', '대치동'],
    '서초구': ['서초동', '반포동', '잠원동', '방배동'],
    '송파구': ['잠실동', '문정동', '가락동', '석촌동'],
    '강동구': ['천호동', '길동', '명일동', '상일동'],
    '마포구': ['합정동', '망원동', '연남동', '상수동', '홍대입구'],
    '용산구': ['이태원동', '한남동', '용산동', '후암동'],
    '성동구': ['성수동', '왕십리', '옥수동', '금호동'],
    '광진구': ['건대입구', '자양동', '구의동', '화양동'],
    '동대문구': ['회기동', '전농동', '이문동', '장안동'],
    '중랑구': ['면목동', '상봉동', '망우동', '신내동'],
    '종로구': ['종로', '인사동', '삼청동', '혜화동', '창신동'],
    '중구': ['명동', '을지로', '충무로', '신당동'],
    '성북구': ['길음동', '정릉동', '돈암동', '석관동'],
    '강북구': ['수유동', '미아동', '번동', '우이동'],
    '도봉구': ['창동', '방학동', '도봉동'],
    '노원구': ['상계동', '중계동', '하계동', '월계동'],
    '은평구': ['불광동', '녹번동', '응암동', '구산동'],
    '서대문구': ['신촌동', '홍제동', '남가좌동', '북가좌동'],
    '양천구': ['목동', '신정동'],
    '강서구': ['마곡동', '화곡동', '방화동', '개화동'],
    '구로구': ['구로동', '고척동', '개봉동', '오류동', '항동'],
    '금천구': ['시흥동', '독산동', '가산동'],
    '영등포구': ['여의도동', '영등포동', '당산동', '문래동'],
    '동작구': ['노량진동', '사당동', '상도동', '흑석동'],
    '관악구': ['신림동', '봉천동', '낙성대'],
  },
  '경기도': {
    '성남시 분당구': ['서현동', '정자동', '판교동'],
    '성남시 수정구': ['태평동', '수진동'],
    '성남시 중원구': ['성남동', '금광동'],
    '수원시 팔달구': ['인계동', '매산동'],
    '수원시 영통구': ['영통동', '광교'],
    '수원시 권선구': ['권선동', '세류동'],
    '수원시 장안구': ['정자동', '연무동'],
    '고양시 일산동구': ['정발산동', '마두동'],
    '고양시 일산서구': ['주엽동', '대화동'],
    '고양시 덕양구': ['화정동', '행신동'],
    '용인시 수지구': ['동천동', '성복동'],
    '용인시 기흥구': ['구성동', '신갈동'],
    '안양시 동안구': ['평촌동', '비산동'],
    '안양시 만안구': ['안양동', '박달동'],
    '부천시': ['상동', '중동', '소사동'],
    '광명시': ['철산동', '하안동'],
    '시흥시': ['정왕동', '배곧동'],
    '안산시 단원구': ['고잔동', '선부동'],
    '안산시 상록구': ['사동', '본오동'],
    '남양주시': ['다산동', '별내동'],
    '하남시': ['미사동', '풍산동', '위례'],
    '화성시': ['동탄', '병점'],
    '오산시': ['원동', '세마동'],
    '평택시': ['비전동', '모곡동'],
    '파주시': ['운정동', '금촌동'],
    '김포시': ['장기동', '구래동'],
    '의정부시': ['의정부동', '가능동'],
    '포천시': ['신읍동', '소흘읍'],
    '이천시': ['중리동', '관고동'],
    '광주시': ['경안동', '오포읍'],
  },
  '인천광역시': {
    '연수구': ['송도동', '동춘동', '연수동'],
    '남동구': ['구월동', '간석동', '논현동'],
    '부평구': ['부평동', '십정동'],
    '서구': ['청라동', '검단동'],
    '미추홀구': ['주안동', '숭의동'],
    '계양구': ['계산동', '작전동'],
    '중구': ['운서동', '신포동'],
  },
  '부산광역시': {
    '해운대구': ['우동', '중동', '좌동', '반여동'],
    '부산진구': ['서면', '부전동', '전포동'],
    '수영구': ['광안동', '남천동', '민락동'],
    '남구': ['대연동', '용호동'],
    '사하구': ['하단동', '괴정동'],
    '동래구': ['명륜동', '온천동'],
    '북구': ['화명동', '덕천동'],
    '강서구': ['명지동', '대저동'],
    '연제구': ['연산동', '거제동'],
    '기장군': ['기장읍', '정관읍'],
  },
  '대구광역시': {
    '수성구': ['범어동', '만촌동', '수성동'],
    '중구': ['동성로', '삼덕동'],
    '달서구': ['월성동', '상인동', '성당동'],
    '동구': ['신암동', '신천동'],
    '북구': ['칠성동', '침산동'],
    '달성군': ['다사읍', '화원읍'],
  },
  '울산광역시': {
    '남구': ['삼산동', '달동', '옥동'],
    '북구': ['진장동', '명촌동'],
    '중구': ['성남동', '학성동'],
    '동구': ['일산동', '방어동'],
    '울주군': ['언양읍', '온산읍'],
  },
  '대전광역시': {
    '서구': ['둔산동', '월평동', '갈마동'],
    '유성구': ['봉명동', '궁동', '노은동'],
    '중구': ['대흥동', '은행동'],
    '동구': ['용전동', '판암동'],
    '대덕구': ['법동', '중리동'],
  },
  '광주광역시': {
    '서구': ['치평동', '농성동', '상무동'],
    '동구': ['충장로', '금남로'],
    '남구': ['봉선동', '주월동'],
    '북구': ['용봉동', '운암동'],
    '광산구': ['수완동', '첨단동'],
  },
  '세종특별자치시': {
    '세종시': ['어진동', '도담동', '새롬동', '아름동'],
  },
  '강원도': {
    '춘천시': ['효자동', '퇴계동', '석사동'],
    '원주시': ['단계동', '무실동', '혁신도시'],
    '강릉시': ['교동', '포남동', '내곡동'],
    '동해시': ['천곡동', '송정동'],
    '속초시': ['조양동', '교동'],
    '삼척시': ['남양동', '교동'],
  },
  '충청북도': {
    '청주시 흥덕구': ['가경동', '복대동'],
    '청주시 청원구': ['내덕동', '율량동'],
    '청주시 상당구': ['용암동', '방서동'],
    '충주시': ['호암동', '연수동'],
    '제천시': ['의림동', '화산동'],
    '음성군': ['음성읍', '금왕읍'],
    '진천군': ['진천읍', '덕산읍'],
  },
  '충청남도': {
    '천안시 서북구': ['불당동', '두정동', '성정동'],
    '천안시 동남구': ['신부동', '청룡동'],
    '아산시': ['온양동', '배방읍', '탕정면'],
    '서산시': ['동문동', '읍내동'],
    '당진시': ['당진동', '합덕읍'],
    '홍성군': ['홍성읍', '광천읍'],
    '논산시': ['논산동', '강경읍'],
    '공주시': ['반죽동', '웅진동'],
  },
  '전라북도': {
    '전주시 완산구': ['효자동', '서신동', '삼천동'],
    '전주시 덕진구': ['금암동', '송천동'],
    '익산시': ['영등동', '모현동'],
    '군산시': ['나운동', '수송동'],
    '완주군': ['삼례읍', '이서면'],
    '정읍시': ['시기동', '연지동'],
    '남원시': ['도통동', '향교동'],
  },
  '전라남도': {
    '순천시': ['조례동', '풍덕동', '신대동'],
    '여수시': ['돌산읍', '문수동'],
    '광양시': ['중마동', '광영동'],
    '목포시': ['상동', '옥암동', '하당동'],
    '나주시': ['빛가람동', '남평읍'],
    '화순군': ['화순읍', '능주면'],
  },
  '경상북도': {
    '포항시 남구': ['대잠동', '오천읍'],
    '포항시 북구': ['흥해읍', '죽도동'],
    '경주시': ['황성동', '안강읍'],
    '구미시': ['원평동', '형곡동'],
    '안동시': ['명륜동', '옥동'],
    '경산시': ['중방동', '진량읍'],
    '칠곡군': ['왜관읍', '북삼읍'],
  },
  '경상남도': {
    '창원시 성산구': ['상남동', '중앙동'],
    '창원시 의창구': ['팔용동', '봉림동'],
    '창원시 마산합포구': ['월포동', '신포동'],
    '창원시 마산회원구': ['합성동', '양덕동'],
    '창원시 진해구': ['석동', '태백동'],
    '김해시': ['부원동', '장유동'],
    '진주시': ['초전동', '상대동'],
    '양산시': ['물금읍', '호계동'],
    '거제시': ['옥포동', '고현동'],
    '통영시': ['무전동', '도남동'],
  },
  '제주특별자치도': {
    '제주시': ['연동', '노형동', '이도동', '아라동'],
    '서귀포시': ['중문동', '대정읍', '성산읍'],
  },
};

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: 1|2|3|4|5) => void; readonly?: boolean }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly && !onChange}
          className={cn('p-0.5 transition-colors', !readonly && 'cursor-pointer')}
          onClick={() => onChange?.(star as 1|2|3|4|5)}
        >
          <Star className={cn(
            'h-4 w-4 transition-colors',
            star <= value ? 'fill-amber text-amber' : 'text-muted-foreground/30'
          )} />
        </button>
      ))}
    </div>
  );
}

const Profile = () => {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [langOpen, setLangOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const [skinType, setSkinType] = useState<SkinType>('중성');
  const [birthDate, setBirthDate] = useState<Date | undefined>(
    undefined
  );
  const [concerns, setConcerns] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [targetAreas, setTargetAreas] = useState<BodyArea[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  type SeasonKey = 'reset' | 'recovery' | 'maintain' | 'boost' | 'special';
  const [currentSeason, setCurrentSeason] = useState<SeasonKey | ''>('');
  const [selectedSido, setSelectedSido] = useState('');
  const [selectedGugun, setSelectedGugun] = useState('');

  const { records, updateRecord } = useRecords();
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [editingMemo, setEditingMemo] = useState<Record<string, string>>({});

  // 언어 드롭다운 외부 클릭 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const sortedRecords = useMemo(() =>
    [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [records]
  );

  const age = useMemo(() => {
    if (!birthDate) return null;
    return differenceInYears(new Date('2026-03-08'), birthDate);
  }, [birthDate]);

  const toggleItem = <T extends string>(list: T[], item: T, setter: (v: T[]) => void) => {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const addRegion = () => {
    if (!selectedSido || !selectedGugun) return;
    const full = `${selectedSido} ${selectedGugun}`;
    if (!regions.includes(full)) {
      setRegions([...regions, full]);
    }
    setSelectedSido('');
    setSelectedGugun('');
  };

  const removeRegion = (region: string) => {
    setRegions(regions.filter(r => r !== region));
  };

  const gugunOptions = selectedSido ? Object.keys(REGION_DATA[selectedSido] || {}) : [];

  const updateSatisfaction = async (id: string, satisfaction: 1|2|3|4|5) => {
    const rec = records.find(r => r.id === id);
    if (!rec) return;
    await updateRecord(id, { ...rec, satisfaction });
  };

  const updateMemo = async (id: string) => {
    const memo = editingMemo[id];
    if (memo !== undefined) {
      const rec = records.find(r => r.id === id);
      if (rec) await updateRecord(id, { ...rec, memo });
      setEditingMemo(prev => { const next = { ...prev }; delete next[id]; return next; });
    }
  };

  const isFirstRender = useRef(true);
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();
  const [saved, setSaved] = useState(false);

  // ── Supabase 프로필 로드 ─────────────────────────────────────────────
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error || !data) return;
      if (data.skin_type) setSkinType(data.skin_type as SkinType);
      if (data.birth_date) setBirthDate(new Date(data.birth_date));
      if (data.concerns) setConcerns(data.concerns as string[]);
      if (data.goals) setGoals(data.goals as string[]);
      if (data.target_areas) setTargetAreas(data.target_areas as BodyArea[]);
      if (data.regions) setRegions(data.regions as string[]);
      if ((data as any).current_season) setCurrentSeason((data as any).current_season as any);
    };
    loadProfile();
  }, []);

  // ── Supabase 프로필 자동저장 ─────────────────────────────────────────
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setSaved(false);
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('user_profiles').upsert({
        id: user.id,
        skin_type: skinType,
        birth_date: birthDate ? birthDate.toISOString().split('T')[0] : null,
        concerns,
        goals,
        target_areas: targetAreas,
        regions,
        current_season: currentSeason || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }, 600);
    return () => clearTimeout(saveTimeout.current);
  }, [skinType, birthDate, concerns, goals, targetAreas, regions, currentSeason]);

  const avgSatisfaction = useMemo(() => {
    const rated = records.filter(r => r.satisfaction);
    if (rated.length === 0) return 0;
    return rated.reduce((sum, r) => sum + (r.satisfaction || 0), 0) / rated.length;
  }, [records]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="relative safe-top overflow-hidden">
        <img src={logoImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="page-header-gradient relative z-10 flex items-center justify-between" style={{ background: 'transparent' }}>
        <h1 className="text-lg font-bold">{t('my_page')}</h1>
        <div className="relative" ref={langDropdownRef}>
          <button
            onClick={() => setLangOpen(prev => !prev)}
            className="h-9 w-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <Globe className="h-4.5 w-4.5 text-muted-foreground" />
          </button>
          {langOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-xl shadow-lg overflow-hidden min-w-[120px]">
              {(['ko', 'en', 'zh'] as Language[]).map(lang => (
                <button
                  key={lang}
                  onClick={() => { setLanguage(lang); setLangOpen(false); }}
                  className={cn(
                    'w-full text-left px-4 py-2.5 text-xs font-medium transition-colors',
                    language === lang
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-muted'
                  )}
                >
                  {LANGUAGE_LABELS[lang]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="page-content pt-2">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="w-full mb-4 rounded-xl">
            <TabsTrigger value="profile" className="flex-1 rounded-lg text-xs gap-1">
              <User className="h-3.5 w-3.5" />
              {t('profile_tab')}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 rounded-lg text-xs gap-1">
              <CreditCard className="h-3.5 w-3.5" />
              결제기록
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-3">

            {/* 기본 정보 */}
            <Card className="glass-card">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-accent flex items-center justify-center">
                    <User className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <h2 className="font-bold text-sm">{t('basic_info')}</h2>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">{t('skin_type')}</Label>
                  <Select value={skinType} onValueChange={(v) => setSkinType(v as SkinType)}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {skinTypes.map((st) => <SelectItem key={st} value={st}>{st}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* ── 관리 시즌 ── */}
                <div className="space-y-2.5">
                  <Label className="text-xs">현재 관리 시즌</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {([
                      { key: 'reset',    emoji: '🌿', title: 'Reset Season',    sub: '피부 리셋 시즌',    desc: '최근 시술이 많았거나 피부를 쉬게 하고 싶을 때. 홈케어 중심으로 피부 균형 회복.' },
                      { key: 'recovery', emoji: '💧', title: 'Recovery Season', sub: '회복 시즌',         desc: '시술 후 예민해진 피부를 진정시키고 피부 장벽을 회복하는 관리 단계.' },
                      { key: 'maintain', emoji: '✨', title: 'Maintain Season', sub: '유지 시즌',         desc: '현재 피부 컨디션을 안정적으로 유지하기 위한 기본 관리 단계.' },
                      { key: 'boost',    emoji: '⚡', title: 'Boost Season',    sub: '관리 끌올 시즌',   desc: '피부톤, 탄력, 수분 등 피부 상태를 한 단계 끌어올리는 집중 관리 단계.' },
                      { key: 'special',  emoji: '💫', title: 'Special Season',  sub: '스페셜 시즌',      desc: '웨딩, 촬영, 중요한 모임 등 특별한 이벤트를 위한 최고 집중 관리 단계.' },
                    ] as const).map(({ key, emoji, title, sub, desc }) => {
                      const isSelected = currentSeason === key;
                      return (
                        <button key={key} onClick={() => setCurrentSeason(isSelected ? '' : key)}
                          className={`w-full text-left px-3.5 py-3 rounded-xl border transition-all ${
                            isSelected
                              ? 'border-[#C9A96E]/60 bg-[#C9A96E]/10'
                              : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                          }`}>
                          <div className="flex items-center gap-2.5">
                            <span className="text-base shrink-0">{emoji}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold ${isSelected ? 'text-[#C9A96E]' : 'text-gray-700'}`}>{title}</span>
                                <span className="text-[10px] text-gray-400">{sub}</span>
                              </div>
                              <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">{desc}</p>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                              isSelected ? 'border-[#C9A96E] bg-[#C9A96E]' : 'border-gray-300'
                            }`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">{t('birth_date')}</Label>
                  <div className="flex gap-2">
                    <Select
                      value={birthDate ? String(birthDate.getFullYear()) : ''}
                      onValueChange={(y) => {
                        const prev = birthDate || new Date(1994, 0, 1);
                        const maxDay = new Date(Number(y), prev.getMonth() + 1, 0).getDate();
                        setBirthDate(new Date(Number(y), prev.getMonth(), Math.min(prev.getDate(), maxDay)));
                      }}
                    >
                      <SelectTrigger className="rounded-xl text-xs h-10 flex-1">
                        <SelectValue placeholder="년도 선택" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {Array.from({ length: new Date().getFullYear() - 1939 }, (_, i) => new Date().getFullYear() - i).map(y => (
                          <SelectItem key={y} value={String(y)} className="text-xs">{y}년</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={birthDate ? String(birthDate.getMonth() + 1) : ''}
                      onValueChange={(m) => {
                        const prev = birthDate || new Date(new Date().getFullYear() - 30, 0, 1);
                        const month = Number(m) - 1;
                        const maxDay = new Date(prev.getFullYear(), month + 1, 0).getDate();
                        setBirthDate(new Date(prev.getFullYear(), month, Math.min(prev.getDate(), maxDay)));
                      }}
                      disabled={!birthDate}
                    >
                      <SelectTrigger className="rounded-xl text-xs h-10 w-20">
                        <SelectValue placeholder="월" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                          <SelectItem key={m} value={String(m)} className="text-xs">{m}월</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={birthDate ? String(birthDate.getDate()) : ''}
                      onValueChange={(d) => {
                        const prev = birthDate || new Date(new Date().getFullYear() - 30, 0, 1);
                        setBirthDate(new Date(prev.getFullYear(), prev.getMonth(), Number(d)));
                      }}
                      disabled={!birthDate}
                    >
                      <SelectTrigger className="rounded-xl text-xs h-10 w-20">
                        <SelectValue placeholder="일" />
                      </SelectTrigger>
                      <SelectContent className="max-h-52">
                        {Array.from(
                          { length: birthDate ? new Date(birthDate.getFullYear(), birthDate.getMonth() + 1, 0).getDate() : 31 },
                          (_, i) => i + 1
                        ).map(d => (
                          <SelectItem key={d} value={String(d)} className="text-xs">{d}일</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                {age !== null && (
                  <div className="shrink-0 bg-primary/10 text-primary px-3 py-2 rounded-xl">
                    <span className="text-sm font-bold">{t('age_prefix')}{age}{t('age_suffix')}</span>
                  </div>
                )}
                </div>
              </CardContent>
            </Card>

            {/* 주요 활동 지역 */}
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-xl bg-sage-light flex items-center justify-center">
                    <Navigation className="h-4 w-4 text-sage-dark" />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm">{t('active_regions')}</h2>
                    <p className="text-[10px] text-muted-foreground">{t('region_desc')}</p>
                  </div>
                </div>

                {regions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {regions.map((r) => (
                      <Badge key={r} variant="default" className="rounded-full px-3 py-1.5 text-xs flex items-center gap-1">
                        {r}
                        <X className="h-3 w-3 cursor-pointer tap-target" onClick={() => removeRegion(r)} />
                      </Badge>
                    ))}
                  </div>
                )}

                {regions.length < 7 && (
                  <>
                    <p className="text-[10px] text-muted-foreground mb-1.5 px-0.5">{t('dense_areas')}</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {[
                        '서울특별시 강남구',
                        '서울특별시 서초구',
                        '서울특별시 송파구',
                        '경기도 성남시 분당구',
                        '부산광역시 해운대구',
                      ].filter(r => !regions.includes(r)).map((r) => (
                        <Badge
                          key={r}
                          variant="outline"
                          className="cursor-pointer transition-all tap-target rounded-full px-3 py-1.5 text-xs"
                          onClick={() => regions.length < 7 && setRegions([...regions, r])}
                        >
                          {r.replace('특별시 ', ' ').replace('광역시 ', ' ').replace('도 ', ' ')}
                        </Badge>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">{t('sido')}</Label>
                        <Select value={selectedSido} onValueChange={(v) => { setSelectedSido(v); setSelectedGugun(''); }}>
                          <SelectTrigger className="rounded-xl text-xs h-9"><SelectValue placeholder={t('sido')} /></SelectTrigger>
                          <SelectContent>
                            {Object.keys(REGION_DATA).map(sido => (
                              <SelectItem key={sido} value={sido} className="text-xs">{sido}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">{t('gugun')}</Label>
                        <Select value={selectedGugun} onValueChange={(v) => {
                          setSelectedGugun(v);
                          if (selectedSido && v) {
                            const full = `${selectedSido} ${v}`;
                            if (!regions.includes(full) && regions.length < 7) {
                              setRegions(prev => [...prev, full]);
                            }
                            setSelectedSido('');
                            setSelectedGugun('');
                          }
                        }} disabled={!selectedSido}>
                          <SelectTrigger className="rounded-xl text-xs h-9"><SelectValue placeholder={t('gugun')} /></SelectTrigger>
                          <SelectContent>
                            {gugunOptions.map(gu => (
                              <SelectItem key={gu} value={gu} className="text-xs">{gu}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full rounded-xl text-xs tap-target"
                      onClick={addRegion}
                      disabled={!selectedSido || !selectedGugun}
                    >
                      + {t('add_region')} ({regions.length}/7)
                    </Button>
                  </>
                )}

                {regions.length >= 7 && (
                  <p className="text-[11px] text-muted-foreground text-center py-1">{t('max_region')}</p>
                )}
              </CardContent>
            </Card>

            {/* 관리 부위 */}
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-xl bg-accent flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <h2 className="font-bold text-sm">{t('care_areas')}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {bodyAreaOptions.map((area) => (
                    <Badge
                      key={area}
                      variant={targetAreas.includes(area) ? 'default' : 'outline'}
                      className="cursor-pointer transition-all tap-target rounded-full px-3 py-1.5 text-xs"
                      onClick={() => toggleItem(targetAreas, area, setTargetAreas)}
                    >
                      {BODY_AREA_LABELS[area]}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 주요 고민 */}
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-xl bg-rose-light flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-rose" />
                  </div>
                  <h2 className="font-bold text-sm">{t('main_concerns')}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {concernOptions.map((c) => (
                    <Badge
                      key={c}
                      variant={concerns.includes(c) ? 'default' : 'outline'}
                      className="cursor-pointer transition-all tap-target rounded-full px-3 py-1.5 text-xs"
                      onClick={() => toggleItem(concerns, c, setConcerns)}
                    >
                      {c}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 관리 목표 */}
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-xl bg-info-light flex items-center justify-center">
                    <Target className="h-4 w-4 text-info" />
                  </div>
                  <h2 className="font-bold text-sm">{t('care_goals')}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {goalOptions.map((g) => (
                    <Badge
                      key={g}
                      variant={goals.includes(g) ? 'default' : 'outline'}
                      className="cursor-pointer transition-all tap-target rounded-full px-3 py-1.5 text-xs"
                      onClick={() => toggleItem(goals, g, setGoals)}
                    >
                      {g}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Logout */}
            <Button
              variant="ghost"
              className="w-full rounded-xl text-sm text-muted-foreground gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              {t('logout')}
            </Button>

            {/* Auto-save indicator */}
            <div className={cn(
              "text-center text-xs py-2 transition-opacity duration-300",
              saved ? "opacity-100 text-sage-dark" : "opacity-0"
            )}>
              {t('auto_saved')}
            </div>
          </TabsContent>

          {/* ===== 결제 기록 탭 ===== */}
          <TabsContent value="history" className="space-y-3">
            <PaymentHistoryTab />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

// ─── 결제 기록 탭 컴포넌트 ────────────────────────────────────────────────
interface PaymentRecord {
  id: string; date: string; clinic: string;
  treatment_name: string; amount: number; method: string; memo?: string;
  charged_amount?: number; clinic_type?: string;
}

interface MatchedTreatment {
  id: string; date: string; treatment_name: string;
  skin_layer?: string; body_area?: string; satisfaction?: number; memo?: string;
}

function PaymentHistoryTab() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [matchedTreatments, setMatchedTreatments] = useState<Record<string, MatchedTreatment[]>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PaymentRecord>>({});
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadPayments = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('payment_records')
      .select('id, date, clinic, treatment_name, amount, method, memo, charged_amount, clinic_type')
      .eq('user_id', user.id)
      .order('date', { ascending: false });
    setPayments(data ?? []);
    setLoading(false);
  };

  useEffect(() => { loadPayments(); }, []);

  const loadMatchedTreatments = async (paymentId: string, date: string, clinic: string) => {
    if (matchedTreatments[paymentId]) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('treatment_records')
      .select('id, date, treatment_name, skin_layer, body_area, satisfaction, memo')
      .eq('user_id', user.id)
      .eq('date', date)
      .eq('clinic', clinic)
      .order('created_at', { ascending: false });
    setMatchedTreatments(prev => ({ ...prev, [paymentId]: data ?? [] }));
  };

  const handleExpand = (p: PaymentRecord) => {
    if (expandedId === p.id) {
      setExpandedId(null);
      setEditingId(null);
    } else {
      setExpandedId(p.id);
      setEditingId(null);
      loadMatchedTreatments(p.id, p.date, p.clinic);
    }
  };

  const startEdit = (p: PaymentRecord) => {
    setEditingId(p.id);
    setEditForm({ date: p.date, clinic: p.clinic, treatment_name: p.treatment_name, amount: p.amount, method: p.method, memo: p.memo });
  };

  const saveEdit = async (id: string) => {
    const { error } = await supabase.from('payment_records').update({
      date: editForm.date,
      clinic: editForm.clinic,
      treatment_name: editForm.treatment_name,
      amount: editForm.amount,
      method: editForm.method,
      memo: editForm.memo || null,
    }).eq('id', id);
    if (!error) {
      setEditingId(null);
      loadPayments();
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase.from('payment_records').delete().eq('id', id);
    if (!error) {
      setPayments(prev => prev.filter(p => p.id !== id));
      if (expandedId === id) setExpandedId(null);
    }
    setDeleting(null);
  };

  const totalSpent = payments
    .filter(p => p.method !== '포인트충전')
    .reduce((s, p) => s + p.amount, 0);

  const LAYER_LABEL: Record<string, string> = { epidermis: '표피', dermis: '진피', subcutaneous: '피하' };

  if (loading) return <div className="text-center py-8 text-sm text-muted-foreground">불러오는 중...</div>;

  return (
    <div className="space-y-3">
      {/* 합계 카드 + 추가 버튼 */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-muted-foreground">총 결제 금액</p>
              <p className="text-xl font-black text-foreground">{totalSpent.toLocaleString()}<span className="text-sm font-normal text-muted-foreground ml-1">원</span></p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-muted-foreground">결제 건수</p>
              <p className="text-xl font-black text-foreground">{payments.filter(p => p.method !== '포인트충전').length}<span className="text-sm font-normal text-muted-foreground ml-1">건</span></p>
            </div>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className="w-full mt-3 rounded-xl text-xs gap-1.5"
            size="sm"
          >
            <Plus className="h-3.5 w-3.5" />
            결제 내역 추가
          </Button>
        </CardContent>
      </Card>

      <AddPaymentModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSaved={() => { setShowAddModal(false); loadPayments(); }}
      />

      {/* 결제 목록 */}
      {payments.length === 0 ? (
        <div className="text-center py-10 text-sm text-muted-foreground">결제 기록이 없습니다</div>
      ) : (
        <div className="space-y-2">
          {payments.map(p => {
            const isExpanded = expandedId === p.id;
            const isEditing = editingId === p.id;
            const matched = matchedTreatments[p.id] ?? [];

            return (
              <Card key={p.id} className="glass-card overflow-hidden">
                {/* 요약 행 */}
                <CardContent className="p-3.5 cursor-pointer" onClick={() => handleExpand(p)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{p.treatment_name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{p.date} · {p.clinic}</p>
                      {p.memo && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{p.memo}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className={`text-sm font-black ${p.method === '포인트충전' ? 'text-emerald-500' : 'text-foreground'}`}>
                          {p.method === '포인트충전' ? '+' : '-'}{p.amount.toLocaleString()}원
                        </p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{p.method}</span>
                      </div>
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                    </div>
                  </div>
                </CardContent>

                {/* 상세 영역 */}
                {isExpanded && (
                  <div className="border-t border-border px-3.5 pb-3.5 pt-3 space-y-3">

                    {/* 결제 상세 정보 (보기 모드) */}
                    {!isEditing ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                          <div><span className="text-muted-foreground">날짜</span><p className="font-medium text-foreground">{p.date}</p></div>
                          <div><span className="text-muted-foreground">병원</span><p className="font-medium text-foreground">{p.clinic}</p></div>
                          <div><span className="text-muted-foreground">결제 방법</span><p className="font-medium text-foreground">{p.method}</p></div>
                          <div><span className="text-muted-foreground">금액</span><p className="font-medium text-foreground">{p.amount.toLocaleString()}원</p></div>
                          {p.charged_amount && p.charged_amount !== p.amount && (
                            <div><span className="text-muted-foreground">충전금액</span><p className="font-medium text-emerald-600">{p.charged_amount.toLocaleString()}원</p></div>
                          )}
                          {p.memo && (
                            <div className="col-span-2"><span className="text-muted-foreground">메모</span><p className="font-medium text-foreground">{p.memo}</p></div>
                          )}
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Button variant="outline" size="sm" className="flex-1 rounded-xl text-xs h-8 gap-1" onClick={(e) => { e.stopPropagation(); startEdit(p); }}>
                            <Pencil className="h-3 w-3" /> 수정
                          </Button>
                          <Button variant="outline" size="sm"
                            className="rounded-xl text-xs h-8 gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                            disabled={deleting === p.id}
                            onClick={(e) => { e.stopPropagation(); if (confirm('이 결제 기록을 삭제하시겠습니까?')) handleDelete(p.id); }}>
                            <Trash2 className="h-3 w-3" /> 삭제
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* 수정 모드 */
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-muted-foreground mb-1 block">날짜</label>
                            <input type="date" value={editForm.date || ''} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                              className="w-full bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground mb-1 block">금액</label>
                            <input type="number" value={editForm.amount || ''} onChange={e => setEditForm(f => ({ ...f, amount: Number(e.target.value) }))}
                              className="w-full bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground mb-1 block">병원명</label>
                          <input type="text" value={editForm.clinic || ''} onChange={e => setEditForm(f => ({ ...f, clinic: e.target.value }))}
                            className="w-full bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground mb-1 block">내용</label>
                          <input type="text" value={editForm.treatment_name || ''} onChange={e => setEditForm(f => ({ ...f, treatment_name: e.target.value }))}
                            className="w-full bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground mb-1 block">결제 방법</label>
                          <div className="flex gap-1.5">
                            {[{ value: '포인트충전', label: '포인트' }, { value: '카드', label: '카드' }, { value: '현금', label: '현금' }, { value: '서비스', label: '서비스' }].map(m => (
                              <button key={m.value} onClick={() => setEditForm(f => ({ ...f, method: m.value }))}
                                className={cn('flex-1 py-1.5 rounded-lg text-[11px] font-semibold border transition-all',
                                  editForm.method === m.value ? 'border-primary bg-primary/10 text-primary' : 'border-input bg-background text-muted-foreground')}>
                                {m.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground mb-1 block">메모</label>
                          <input type="text" value={editForm.memo || ''} onChange={e => setEditForm(f => ({ ...f, memo: e.target.value }))}
                            placeholder="메모 (선택)"
                            className="w-full bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Button size="sm" className="flex-1 rounded-xl text-xs h-8 gap-1" onClick={() => saveEdit(p.id)}>
                            <Check className="h-3 w-3" /> 저장
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-xl text-xs h-8" onClick={() => setEditingId(null)}>
                            취소
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* 매핑된 시술 기록 */}
                    {matched.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                          <ClipboardList className="h-3 w-3" /> 같은 날 시술 기록 ({matched.length}건)
                        </p>
                        {matched.map(t => (
                          <div key={t.id} className="bg-muted/50 rounded-lg px-3 py-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-medium text-foreground">{t.treatment_name}</p>
                                {t.skin_layer && (
                                  <span className={cn('text-[9px] px-1 py-0.5 rounded border font-medium',
                                    t.skin_layer === 'epidermis' ? 'bg-amber-100 text-amber-600 border-amber-300'
                                    : t.skin_layer === 'dermis' ? 'bg-blue-100 text-blue-600 border-blue-300'
                                    : 'bg-purple-100 text-purple-600 border-purple-300'
                                  )}>{LAYER_LABEL[t.skin_layer] || t.skin_layer}</span>
                                )}
                              </div>
                              {t.satisfaction && (
                                <div className="flex gap-0.5">
                                  {[1,2,3,4,5].map(s => (
                                    <Star key={s} className={cn('h-3 w-3', s <= t.satisfaction! ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20')} />
                                  ))}
                                </div>
                              )}
                            </div>
                            {t.memo && <p className="text-[10px] text-muted-foreground mt-0.5">{t.memo}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                    {matched.length === 0 && expandedId === p.id && (
                      <p className="text-[10px] text-muted-foreground text-center py-2">같은 날/같은 병원의 시술 기록이 없습니다</p>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Profile;

