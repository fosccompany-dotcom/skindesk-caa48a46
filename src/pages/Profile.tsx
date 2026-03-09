import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { mockProfile } from '@/data/mockData';
import { SkinType, BodyArea, BODY_AREA_LABELS } from '@/types/skin';
import { User, Target, AlertCircle, MapPin, Navigation, CalendarIcon, X, Search as SearchIcon } from 'lucide-react';
import { format, differenceInYears } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import TreatmentSearch from '@/components/TreatmentSearch';

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
  },
  '경기도': {
    '성남시 분당구': ['서현동', '정자동', '판교동'],
    '성남시 수정구': ['태평동', '수진동'],
    '수원시 팔달구': ['인계동', '매산동'],
    '수원시 영통구': ['영통동', '광교'],
    '고양시 일산동구': ['정발산동', '마두동'],
    '고양시 일산서구': ['주엽동', '대화동'],
    '용인시 수지구': ['동천동', '성복동'],
    '하남시': ['미사동', '풍산동'],
    '화성시': ['동탄', '병점'],
  },
  '부산광역시': {
    '해운대구': ['우동', '중동', '좌동'],
    '부산진구': ['서면', '부전동', '전포동'],
    '수영구': ['광안동', '남천동'],
    '남구': ['대연동', '용호동'],
    '사하구': ['하단동', '괴정동'],
  },
  '대구광역시': {
    '수성구': ['범어동', '만촌동', '수성동'],
    '중구': ['동성로', '삼덕동'],
    '달서구': ['월성동', '상인동'],
  },
  '인천광역시': {
    '연수구': ['송도동', '동춘동'],
    '남동구': ['구월동', '간석동'],
    '부평구': ['부평동', '십정동'],
  },
  '대전광역시': {
    '서구': ['둔산동', '월평동', '갈마동'],
    '유성구': ['봉명동', '궁동'],
  },
  '광주광역시': {
    '서구': ['치평동', '농성동'],
    '동구': ['충장로', '금남로'],
  },
  '제주특별자치도': {
    '제주시': ['연동', '노형동', '이도동'],
    '서귀포시': ['중문동', '대정읍'],
  },
};

const Profile = () => {
  const [skinType, setSkinType] = useState<SkinType>(mockProfile.skinType);
  const [birthDate, setBirthDate] = useState<Date | undefined>(
    mockProfile.birthDate ? new Date(mockProfile.birthDate) : undefined
  );
  const [dateOpen, setDateOpen] = useState(false);
  const [concerns, setConcerns] = useState<string[]>(mockProfile.concerns);
  const [goals, setGoals] = useState<string[]>(mockProfile.goals);
  const [targetAreas, setTargetAreas] = useState<BodyArea[]>(mockProfile.targetAreas);
  const [regions, setRegions] = useState<string[]>([]);
  const [selectedSido, setSelectedSido] = useState('');
  const [selectedGugun, setSelectedGugun] = useState('');

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

  return (
    <div className="min-h-screen bg-background">
      <div className="page-header safe-top">
        <h1 className="text-lg font-bold">마이페이지</h1>
      </div>

      <div className="page-content pt-2">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="w-full mb-4 rounded-xl">
            <TabsTrigger value="profile" className="flex-1 rounded-lg text-xs gap-1">
              <User className="h-3.5 w-3.5" />
              프로필
            </TabsTrigger>
            <TabsTrigger value="treatments" className="flex-1 rounded-lg text-xs gap-1">
              <SearchIcon className="h-3.5 w-3.5" />
              시술 검색
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
                  <h2 className="font-bold text-sm">기본 정보</h2>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">피부 타입</Label>
                  <Select value={skinType} onValueChange={(v) => setSkinType(v as SkinType)}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {skinTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">생년월일</Label>
                  <div className="flex items-center gap-3">
                    <Popover open={dateOpen} onOpenChange={setDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "flex-1 justify-start text-left font-normal rounded-xl",
                            !birthDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          {birthDate ? format(birthDate, 'yyyy년 M월 d일', { locale: ko }) : '생년월일 선택'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={birthDate}
                          onSelect={(date) => { setBirthDate(date); setDateOpen(false); }}
                          locale={ko}
                          defaultMonth={birthDate || new Date(1994, 0)}
                          fromYear={1950}
                          toYear={2010}
                          captionLayout="dropdown-buttons"
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    {age !== null && (
                      <div className="shrink-0 bg-primary/10 text-primary px-3 py-2 rounded-xl">
                        <span className="text-sm font-bold">만 {age}세</span>
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
                    <h2 className="font-bold text-sm">주요 활동 지역</h2>
                    <p className="text-[10px] text-muted-foreground">병원 추천 시 활용됩니다 · 최대 7개</p>
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
                    <p className="text-[10px] text-muted-foreground mb-1.5 px-0.5">피부과 밀집 지역</p>
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
                        <Label className="text-[10px] text-muted-foreground">시/도</Label>
                        <Select value={selectedSido} onValueChange={(v) => { setSelectedSido(v); setSelectedGugun(''); }}>
                          <SelectTrigger className="rounded-xl text-xs h-9"><SelectValue placeholder="시/도 선택" /></SelectTrigger>
                          <SelectContent>
                            {Object.keys(REGION_DATA).map(sido => (
                              <SelectItem key={sido} value={sido} className="text-xs">{sido}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">시/군/구</Label>
                        <Select value={selectedGugun} onValueChange={setSelectedGugun} disabled={!selectedSido}>
                          <SelectTrigger className="rounded-xl text-xs h-9"><SelectValue placeholder="구/군 선택" /></SelectTrigger>
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
                      + 지역 추가 ({regions.length}/7)
                    </Button>
                  </>
                )}

                {regions.length >= 7 && (
                  <p className="text-[11px] text-muted-foreground text-center py-1">최대 7개 지역까지 등록할 수 있습니다</p>
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
                  <h2 className="font-bold text-sm">관리 부위</h2>
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
                  <h2 className="font-bold text-sm">주요 고민</h2>
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
                  <h2 className="font-bold text-sm">관리 목표</h2>
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

            {/* Auto-save indicator */}
            <div className={cn(
              "text-center text-xs py-2 transition-opacity duration-300",
              saved ? "opacity-100 text-sage-dark" : "opacity-0"
            )}>
              ✓ 자동 저장됨
            </div>
          </TabsContent>

          <TabsContent value="treatments">
            <TreatmentSearch />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
