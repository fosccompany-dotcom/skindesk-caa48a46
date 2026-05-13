import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  onSkip: () => void;
  onDontShowAgain: () => void;
}

const SkinDiagnosisOnboardingModal = ({ open, onSkip, onDontShowAgain }: Props) => {
  const navigate = useNavigate();

  if (!open) return null;

  const startQuiz = () => {
    onSkip(); // close modal (session)
    navigate('/skin-quiz');
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-foreground/60">
      <div
        className="relative bg-card rounded-2xl shadow-2xl border border-border/50 w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-7 pb-4 text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-lg">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-lg font-bold text-foreground">
            나의 피부, 먼저 알아볼까요?
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {`간단한 진단으로 P·O·I·H·A 5축 점수를 확인하고\n나에게 맞는 시술 추천을 받아보세요.`}
          </p>
        </div>

        <div className="px-5 pb-5 space-y-2">
          <Button
            className="w-full rounded-xl h-11 text-sm font-bold bg-[#F2C94C] hover:bg-[#e0b83e] text-foreground"
            onClick={startQuiz}
          >
            진단 시작하기 →
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="flex-1 rounded-xl h-10 text-sm text-muted-foreground"
              onClick={onSkip}
            >
              Skip
            </Button>
            <Button
              variant="ghost"
              className="flex-1 rounded-xl h-10 text-sm text-muted-foreground"
              onClick={onDontShowAgain}
            >
              다시 보지 않기
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SkinDiagnosisOnboardingModal;
