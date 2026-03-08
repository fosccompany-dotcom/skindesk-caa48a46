import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { mockProfile } from '@/data/mockData';
import { SkinType, BodyArea, BODY_AREA_LABELS } from '@/types/skin';
import { User, Target, AlertCircle, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const skinTypes: SkinType[] = ['건성', '지성', '복합성', '민감성', '중성'];
const concernOptions = ['모공', '색소침착', '탄력저하', '주름', '여드름', '홍조', '건조', '다크서클', '제모', '셀룰라이트', '튼살'];
const goalOptions = ['맑은 피부톤', '모공 축소', '탄력 개선', '주름 개선', '트러블 완화', '보습 강화', '바디라인 정리', '제모 완료'];
const bodyAreaOptions: BodyArea[] = ['face', 'neck', 'arm', 'leg', 'abdomen', 'back', 'chest', 'hip'];

const Profile = () => {
  const { toast } = useToast();
  const [skinType, setSkinType] = useState<SkinType>(mockProfile.skinType);
  const [age, setAge] = useState(mockProfile.age.toString());
  const [concerns, setConcerns] = useState<string[]>(mockProfile.concerns);
  const [goals, setGoals] = useState<string[]>(mockProfile.goals);
  const [targetAreas, setTargetAreas] = useState<BodyArea[]>(mockProfile.targetAreas);

  const toggleItem = <T extends string>(list: T[], item: T, setter: (v: T[]) => void) => {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
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
              <Label className="text-xs">나이</Label>
              <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-24 rounded-xl" />
            </div>
          </CardContent>
        </Card>

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