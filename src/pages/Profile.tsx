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
    <div className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold">프로필 설정</h1>
        <p className="text-sm text-muted-foreground mt-1">나의 피부 정보를 설정하세요</p>
      </div>

      <div className="mx-auto max-w-lg space-y-4 px-4">
        <Card className="glass-card">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-sm">기본 정보</h2>
            </div>
            <div className="space-y-2">
              <Label>피부 타입</Label>
              <Select value={skinType} onValueChange={(v) => setSkinType(v as SkinType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {skinTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>나이</Label>
              <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-24" />
            </div>
          </CardContent>
        </Card>

        {/* Target Areas */}
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-sage" />
              <h2 className="font-semibold text-sm">관리 부위</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {bodyAreaOptions.map((area) => (
                <Badge
                  key={area}
                  variant={targetAreas.includes(area) ? 'default' : 'outline'}
                  className="cursor-pointer transition-all"
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
              <AlertCircle className="h-4 w-4 text-rose" />
              <h2 className="font-semibold text-sm">주요 고민</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {concernOptions.map((c) => (
                <Badge
                  key={c}
                  variant={concerns.includes(c) ? 'default' : 'outline'}
                  className="cursor-pointer transition-all"
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
              <Target className="h-4 w-4 text-info" />
              <h2 className="font-semibold text-sm">관리 목표</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {goalOptions.map((g) => (
                <Badge
                  key={g}
                  variant={goals.includes(g) ? 'default' : 'outline'}
                  className="cursor-pointer transition-all"
                  onClick={() => toggleItem(goals, g, setGoals)}
                >
                  {g}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="w-full">저장하기</Button>
      </div>
    </div>
  );
};

export default Profile;
