import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useRecords } from '@/context/RecordsContext';
import { SkinType, BodyArea, BODY_AREA_LABELS, SKIN_LAYER_LABELS, TreatmentRecord } from '@/types/skin';
import { User, Target, AlertCircle, MapPin, Navigation, X, ClipboardList, Star, ChevronDown, ChevronUp, Globe, LogOut } from 'lucide-react';
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
    '강동구': ['천호동', '길동', '명일동'],
    '마포구': ['합정동', '망원동', '연남동', '상수동', '홍대'],
    '용산구': ['이태원동', '한남동', '용산동'],
    '성동구': ['성수동', '왕십리'],
    '광진구': ['건대입구', '자양동'],
    '종로구': ['종로', '인사동', '삼청동'],
    '중구': ['명동', '을지로', '충무로'],
    '영등포구': ['여의도동', '영등포동'],
    '관악구': ['신림동', '봉천동'],
    '강서구': ['마곡동', '화곡동'],
    '은평구': ['불광동', '녹번동'],
    '노원구': ['상계동', '중계동'],
    '도봉구': ['창동', '방학동'],
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
  const [skinType, setSkinType] = useState<SkinType>('normal');
  const [birthDate, setBirthDate] = useState<Date | undefined>(
    undefined
  );
  const [concerns, setConcerns] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [targetAreas, setTargetAreas] = useState<BodyArea[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [selectedSido, setSelectedSido] = useState('');
  const [selectedGugun, setSelectedGugun] = useState('');

  const { records, updateRecord } = useRecords();
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [editingMemo, setEditingMemo] = useState<Record<string, string>>({});

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

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setSaved(false);
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }, 600);
    return () => clearTimeout(saveTimeout.current);
  }, [skinType, birthDate, concerns, goals, targetAreas, regions]);

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
      <div className="page-header safe-top">
        <h1 className="text-lg font-bold">{t('my_page')}</h1>
      </div>

      <div className="page-content pt-2">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="w-full mb-4 rounded-xl">
            <TabsTrigger value="profile" className="flex-1 rounded-lg text-xs gap-1">
              <User className="h-3.5 w-3.5" />
              {t('profile_tab')}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 rounded-lg text-xs gap-1">
              <ClipboardList className="h-3.5 w-3.5" />
              {t('treatment_history_tab')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-3">
            {/* Language Setting */}
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-xl bg-info-light flex items-center justify-center">
                    <Globe className="h-4 w-4 text-info" />
                  </div>
                  <h2 className="font-bold text-sm">{t('language_setting')}</h2>
                </div>
                <div className="flex gap-2">
                  {(['ko', 'en', 'zh'] as Language[]).map(lang => (
                    <Badge
                      key={lang}
                      variant={language === lang ? 'default' : 'outline'}
                      className="cursor-pointer rounded-full px-4 py-2 text-xs font-medium"
                      onClick={() => setLanguage(lang)}
                    >
                      {LANGUAGE_LABELS[lang]}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

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
                        <Select value={selectedGugun} onValueChange={setSelectedGugun} disabled={!selectedSido}>
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

          {/* ===== 시술 기록 탭 ===== */}
          <TabsContent value="history" className="space-y-3">
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-muted-foreground">{t('total_records')}</p>
                    <p className="text-2xl font-bold text-foreground">{records.length}<span className="text-sm font-normal text-muted-foreground">건</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-muted-foreground">{t('avg_satisfaction')}</p>
                    <div className="flex items-center gap-1.5">
                      <Star className="h-4 w-4 fill-amber text-amber" />
                      <span className="text-2xl font-bold text-foreground">{avgSatisfaction.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              {sortedRecords.map((record) => {
                const isExpanded = expandedRecord === record.id;
                const memoValue = editingMemo[record.id] ?? record.memo ?? '';

                return (
                  <Card key={record.id} className="glass-card overflow-hidden">
                    <button
                      className="w-full text-left"
                      onClick={() => setExpandedRecord(isExpanded ? null : record.id)}
                    >
                      <CardContent className="p-3.5">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold text-foreground">{record.treatmentName}</span>
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0">{BODY_AREA_LABELS[record.bodyArea]}</Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {format(new Date(record.date), 'yyyy.M.d (EEE)', { locale: ko })} · {record.clinic}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {record.satisfaction && (
                              <div className="flex items-center gap-0.5">
                                <Star className="h-3 w-3 fill-amber text-amber" />
                                <span className="text-xs font-semibold text-foreground">{record.satisfaction}</span>
                              </div>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        {record.notes && !isExpanded && (
                          <p className="text-[10px] text-muted-foreground mt-1 truncate">{record.notes}</p>
                        )}
                      </CardContent>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-border/50 px-3.5 pb-3.5 pt-3 space-y-3">
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant="secondary" className="text-[10px]">{SKIN_LAYER_LABELS[record.skinLayer]}</Badge>
                          <Badge variant="secondary" className="text-[10px]">{BODY_AREA_LABELS[record.bodyArea]}</Badge>
                          <Badge variant="outline" className="text-[10px]">{record.clinic}</Badge>
                        </div>

                        {record.notes && (
                          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2.5">{record.notes}</p>
                        )}

                        <div>
                          <Label className="text-[11px] text-muted-foreground mb-1.5 block">{t('satisfaction')}</Label>
                          <StarRating
                            value={record.satisfaction || 0}
                            onChange={(v) => updateSatisfaction(record.id, v)}
                          />
                        </div>

                        <div>
                          <Label className="text-[11px] text-muted-foreground mb-1.5 block">메모</Label>
                          <Textarea
                            value={memoValue}
                            onChange={(e) => setEditingMemo(prev => ({ ...prev, [record.id]: e.target.value }))}
                            placeholder={t('memo_placeholder')}
                            className="text-xs min-h-[80px] rounded-xl resize-none"
                          />
                          {editingMemo[record.id] !== undefined && editingMemo[record.id] !== (record.memo ?? '') && (
                            <Button
                              size="sm"
                              className="mt-2 w-full rounded-xl text-xs"
                              onClick={() => updateMemo(record.id)}
                            >
                              {t('save')}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>

            {sortedRecords.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                {t('no_records')}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;

