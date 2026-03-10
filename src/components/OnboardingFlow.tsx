import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/i18n/LanguageContext';
import { SkinType, BodyArea, BODY_AREA_LABELS } from '@/types/skin';
import { User, Sparkles } from 'lucide-react';

const skinTypes: SkinType[] = ['건성', '지성', '복합성', '민감성', '중성'];
const bodyAreas: BodyArea[] = ['face', 'neck', 'arm', 'leg', 'abdomen', 'back', 'chest', 'hip'];
const concerns = ['모공', '색소침착', '탄력저하', '주름', '여드름', '홍조', '건조', '다크서클'];

interface Props {
  open: boolean;
  onClose: () => void;
}

const OnboardingFlow = ({ open, onClose }: Props) => {
  const { t } = useLanguage();
  const [step, setStep] = useState<'basic' | 'treatment'>('basic');

  // Basic info state
  const [skinType, setSkinType] = useState<SkinType>('복합성');
  const [selectedAreas, setSelectedAreas] = useState<BodyArea[]>(['face']);
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);

  const toggleItem = <T extends string>(list: T[], item: T, setter: (v: T[]) => void) => {
    setter(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const handleSkip = () => {
    if (step === 'basic') {
      setStep('treatment');
    } else {
      onClose();
    }
  };

  const handleNext = () => {
    if (step === 'basic') {
      // TODO: Save basic info to Supabase profile
      setStep('treatment');
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[400px] max-h-[85vh] overflow-y-auto rounded-2xl p-0 gap-0">
        {step === 'basic' ? (
          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="h-14 w-14 rounded-2xl bg-accent mx-auto flex items-center justify-center">
                <User className="h-7 w-7 text-accent-foreground" />
              </div>
              <h2 className="text-lg font-bold">{t('onboard_basic_info')}</h2>
              <p className="text-xs text-muted-foreground">{t('onboard_basic_desc')}</p>
            </div>

            {/* Skin type */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">{t('skin_type')}</Label>
              <Select value={skinType} onValueChange={(v) => setSkinType(v as SkinType)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {skinTypes.map(st => <SelectItem key={st} value={st}>{st}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Care areas */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">{t('care_areas')}</Label>
              <div className="flex flex-wrap gap-2">
                {bodyAreas.map(area => (
                  <Badge
                    key={area}
                    variant={selectedAreas.includes(area) ? 'default' : 'outline'}
                    className="cursor-pointer rounded-full px-3 py-1.5 text-xs"
                    onClick={() => toggleItem(selectedAreas, area, setSelectedAreas)}
                  >
                    {BODY_AREA_LABELS[area]}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Concerns */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">{t('main_concerns')}</Label>
              <div className="flex flex-wrap gap-2">
                {concerns.map(c => (
                  <Badge
                    key={c}
                    variant={selectedConcerns.includes(c) ? 'default' : 'outline'}
                    className="cursor-pointer rounded-full px-3 py-1.5 text-xs"
                    onClick={() => toggleItem(selectedConcerns, c, setSelectedConcerns)}
                  >
                    {c}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button variant="ghost" className="flex-1 rounded-xl" onClick={handleSkip}>
                {t('skip')}
              </Button>
              <Button className="flex-1 rounded-xl" onClick={handleNext}>
                {t('next')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <div className="text-center space-y-2">
              <div className="h-14 w-14 rounded-2xl bg-[#C9A96E]/15 mx-auto flex items-center justify-center">
                <Sparkles className="h-7 w-7 text-[#C9A96E]" />
              </div>
              <h2 className="text-lg font-bold">{t('onboard_treatment')}</h2>
              <p className="text-xs text-muted-foreground">{t('onboard_treatment_desc')}</p>
            </div>

            <div className="bg-muted/50 rounded-2xl p-5 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                홈 화면의 <span className="text-[#C9A96E] font-semibold">+ 버튼</span>을 눌러<br />
                언제든 시술을 기록할 수 있어요.
              </p>
              <div className="h-12 w-12 rounded-full bg-[#C9A96E] mx-auto flex items-center justify-center shadow-lg">
                <span className="text-xl text-black font-bold">+</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="ghost" className="flex-1 rounded-xl" onClick={handleSkip}>
                {t('skip')}
              </Button>
              <Button className="flex-1 rounded-xl" onClick={handleNext}>
                {t('close')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingFlow;
