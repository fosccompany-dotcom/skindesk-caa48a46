import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const STEPS = [
  {
    key: 'fab',
    selector: 'button[aria-label="시술 기록 추가"]',
    title: '시술 기록 버튼',
    desc: '이 버튼을 눌러\n시술 기록을 추가할 수 있어요',
    position: 'top' as const,
    padding: 10,
    borderRadius: 9999,
  },
  {
    key: 'nav',
    selector: 'nav.fixed.bottom-0',
    title: '하단 네비게이션',
    desc: '홈 · 리스트 · 시술권 · 캘린더 · 마이\n탭을 눌러 주요 기능을 이동해요',
    position: 'top' as const,
    padding: 6,
    borderRadius: 16,
  },
  {
    key: 'nav-packages',
    selector: 'nav.fixed.bottom-0 button:nth-child(3)',
    title: '시술권 · 결제 관리',
    desc: '시술권, 포인트, 결제 내역을\n한 곳에서 관리할 수 있어요',
    position: 'top' as const,
    padding: 8,
    borderRadius: 16,
  },
  {
    key: 'nav-my',
    selector: 'nav.fixed.bottom-0 button:last-child',
    title: '마이 페이지',
    desc: '피부 타입, 관리 목표, 시즌 등\n개인 설정을 관리해요',
    position: 'top' as const,
    padding: 8,
    borderRadius: 16,
  },
  {
    key: 'finish',
    selector: null,
    title: '준비 완료! 🎉',
    desc: '이제 나만의 피부 관리를 시작해보세요.\n먼저 마이 정보를 등록하시겠어요?',
    position: 'center' as const,
    padding: 0,
    borderRadius: 0,
  },
] as const;

const OnboardingFlow = ({ open, onClose }: Props) => {
  const navigate = useNavigate();
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const rafRef = useRef<number>(0);

  const step = STEPS[stepIdx];
  const isLast = stepIdx === STEPS.length - 1;

  const measureTarget = useCallback(() => {
    if (!step.selector) {
      setRect(null);
      return;
    }
    const el = document.querySelector(step.selector);
    if (el) {
      const r = el.getBoundingClientRect();
      const p = step.padding;
      setRect({
        top: r.top - p,
        left: r.left - p,
        width: r.width + p * 2,
        height: r.height + p * 2,
      });
    }
  }, [step]);

  useEffect(() => {
    if (!open) return;
    measureTarget();
    const handleResize = () => measureTarget();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [open, stepIdx, measureTarget]);

  const next = () => {
    if (isLast) return;
    setStepIdx(stepIdx + 1);
  };

  const skip = () => onClose();

  const goToProfile = () => {
    onClose();
    navigate('/profile');
  };

  if (!open) return null;

  // Calculate tooltip position — anchor to the spotlight target
  const tooltipWidth = 320;
  const gap = 16;

  const getTooltipStyle = (): React.CSSProperties => {
    if (step.position === 'center' || !rect) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: tooltipWidth,
      };
    }

    // Center of the spotlight
    const targetCenterX = rect.left + rect.width / 2;
    // Clamp so tooltip stays on screen
    const minLeft = 16;
    const maxLeft = window.innerWidth - tooltipWidth - 16;
    let tooltipLeft = targetCenterX - tooltipWidth / 2;
    tooltipLeft = Math.max(minLeft, Math.min(maxLeft, tooltipLeft));

    // Arrow offset relative to tooltip
    const arrowLeft = targetCenterX - tooltipLeft;

    return {
      position: 'fixed',
      bottom: `${window.innerHeight - rect.top + gap}px`,
      left: tooltipLeft,
      width: tooltipWidth,
      '--arrow-left': `${arrowLeft}px`,
    } as React.CSSProperties;
  };

  // Arrow X position (for use in JSX)
  const getArrowLeft = (): number => {
    if (!rect) return tooltipWidth / 2;
    const targetCenterX = rect.left + rect.width / 2;
    const minLeft = 16;
    const maxLeft = window.innerWidth - tooltipWidth - 16;
    let tooltipLeft = targetCenterX - tooltipWidth / 2;
    tooltipLeft = Math.max(minLeft, Math.min(maxLeft, tooltipLeft));
    return targetCenterX - tooltipLeft;
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999]" style={{ pointerEvents: 'auto' }}>
      {/* Dark overlay with spotlight cutout using SVG */}
      <svg
        className="fixed inset-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id="coachmark-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left}
                y={rect.top}
                width={rect.width}
                height={rect.height}
                rx={step.borderRadius}
                ry={step.borderRadius}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="hsl(var(--foreground) / 0.75)"
          mask="url(#coachmark-mask)"
        />
      </svg>

      {/* Spotlight border glow */}
      {rect && (
        <div
          className="fixed pointer-events-none"
          style={{
            top: rect.top - 2,
            left: rect.left - 2,
            width: rect.width + 4,
            height: rect.height + 4,
            borderRadius: step.borderRadius,
            border: '2px solid rgba(242, 201, 76, 0.6)',
            boxShadow: '0 0 20px rgba(242, 201, 76, 0.3)',
          }}
        />
      )}

      {/* Click blocker (tap anywhere except spotlight to go next) */}
      <div
        className="fixed inset-0"
        style={{ pointerEvents: 'auto' }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (!isLast) next();
        }}
      />

      {/* Tooltip */}
      <div
        style={{ ...getTooltipStyle(), pointerEvents: 'auto', zIndex: 10 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-card rounded-2xl shadow-2xl border border-border/50 overflow-hidden">
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 pt-4 pb-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === stepIdx ? 'w-6 bg-accent' : i < stepIdx ? 'w-1.5 bg-accent/50' : 'w-1.5 bg-muted'
                }`}
              />
            ))}
          </div>

          <div className="px-5 pt-3 pb-4 text-center space-y-2">
            {isLast && (
              <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-lg mb-3">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            )}
            <h3 className="text-base font-bold text-foreground">{step.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {step.desc}
            </p>
          </div>

          {/* Arrow pointing down to element */}
          {step.position === 'top' && rect && (
            <div
              className="absolute -bottom-2 w-0 h-0"
              style={{
                left: getArrowLeft(),
                transform: 'translateX(-50%)',
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '8px solid hsl(var(--card))',
              }}
            />
          )}

          {/* Actions */}
          <div className="px-5 pb-4">
            {isLast ? (
              <div className="space-y-2">
                <Button
                  className="w-full rounded-xl h-11 text-sm font-bold bg-[#F2C94C] hover:bg-[#e0b83e] text-foreground"
                  onClick={goToProfile}
                >
                  마이 정보 등록하기 →
                </Button>
                <Button
                  variant="ghost"
                  className="w-full rounded-xl h-11 text-sm"
                  onClick={(e) => { e.stopPropagation(); onClose(); }}
                >
                  나중에 할게요
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="flex-1 rounded-xl text-muted-foreground text-sm"
                  onClick={skip}
                >
                  건너뛰기
                </Button>
                <Button
                  className="flex-1 rounded-xl bg-[#F2C94C] hover:bg-[#e0b83e] text-foreground font-bold text-sm"
                  onClick={next}
                >
                  다음 ({stepIdx + 1}/{STEPS.length})
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default OnboardingFlow;
