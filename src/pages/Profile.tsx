import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { mockProfile } from '@/data/mockData';
import { SkinType, BodyArea, BODY_AREA_LABELS } from '@/types/skin';
import { User, Target, AlertCircle, MapPin, Navigation, CalendarIcon, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInYears } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const skinTypes: SkinType[] = ['건성', '지성', '복합성', '민감성', '중성'];
const concernOptions = ['모공', '색소침착', '탄력저하', '주름', '여드름', '홍조', '건조', '다크서클', '제모', '셀룰라이트', '튼살'];
const goalOptions = ['맑은 피부톤', '모공 축소', '탄력 개선', '주름 개선', '트러블 완화', '보습 강화', '바디라인 정리', '제모 완료'];
const bodyAreaOptions: BodyArea[] = ['face', 'neck', 'arm', 'leg', 'abdomen', 'back', 'chest', 'hip'];

const regionOptions = [
  '강남', '서초', '송파', '잠실', '압구정', '청담', '신사',
  '이태원', '한남', '용산', '종로', '을지로', '명동',
  '여의도', '마포', '홍대', '합정', '성수', '건대',
  '분당', '판교', '수원', '일산', '부산 서면', '부산 해운대',
  '대구 수성', '대전 둔산',
];

const Profile = () => {
  const { toast } = useToast();
  const [skinType, setSkinType] = useState<SkinType>(mockProfile.skinType);
  const [birthDate, setBirthDate] = useState<Date | undefined>(
    mockProfile.birthDate ? new Date(mockProfile.birthDate) : undefined
  );
  const [dateOpen, setDateOpen] = useState(false);
  const [concerns, setConcerns] = useState<string[]>(mockProfile.concerns);
  const [goals, setGoals] = useState<string[]>(mockProfile.goals);
  const [targetAreas, setTargetAreas] = useState<BodyArea[]>(mockProfile.targetAreas);
  const [regions, setRegions] = useState<string[]>(mockProfile.regions);
  const [customRegion, setCustomRegion] = useState('');

  const age = useMemo(() => {
    if (!birthDate) return null;
    return differenceInYears(new Date('2026-03-08'), birthDate);
  }, [birthDate]);

  const toggleItem = <T extends string>(list: T[], item: T, setter: (v: T[]) => void) => {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const addCustomRegion = () => {
    const trimmed = customRegion.trim();
    if (trimmed && !regions.includes(trimmed)) {
      setRegions([...regions, trimmed]);
      setCustomRegion('');
    }
  };

  const removeRegion = (region: string) => {
    setRegions(regions.filter(r => r !== region));
  };

  const handleSave = () => {
    toast({ title: '프로필 저장 완료', description: '피부 정보가 업데이트되었습니다.' });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="page-header safe-top">
        <h1 className="text-lg font-bold">프로필 설정</h1>
        <p className="text-xs text-muted-foreground mt-1">나의 피부 정보를 설정하세요</p>
      </div>

      <div className="page-content space-y-3">
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
                <p className="text-[10px] text-muted-foreground">병원 추천 시 활용됩니다</p>
              </div>
            </div>

            {/* 선택된 지역 */}
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

            {/* 지역 선택 */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {regionOptions.filter(r => !regions.includes(r)).slice(0, 12).map((r) => (
                <Badge
                  key={r}
                  variant="outline"
                  className="cursor-pointer transition-all tap-target rounded-full px-3 py-1.5 text-xs"
                  onClick={() => setRegions([...regions, r])}
                >
                  {r}
                </Badge>
              ))}
            </div>

            {/* 직접 입력 */}
            <div className="flex gap-2">
              <Input
                value={customRegion}
                onChange={(e) => setCustomRegion(e.target.value)}
                placeholder="직접 입력"
                className="rounded-xl text-xs flex-1"
                onKeyDown={(e) => e.key === 'Enter' && addCustomRegion()}
              />
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs shrink-0 tap-target"
                onClick={addCustomRegion}
                disabled={!customRegion.trim()}
              >
                추가
              </Button>
            </div>
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

        <Button onClick={handleSave} className="w-full rounded-2xl h-12 font-bold text-sm tap-target">
          저장하기
        </Button>
      </div>
    </div>
  );
};

export default Profile;