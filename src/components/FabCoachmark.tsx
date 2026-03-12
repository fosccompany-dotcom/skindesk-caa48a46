import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  onClose: () => void;
  onClickParse: () => void;
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const STEPS = [
  {
    key: 'mode-toggle',
    selector: '[data-coach="mode-toggle"]',
    title: '시술내역 · 시술권 추가',
    desc: '시술내역과 시술권을\n탭으로 구분하여 등록해요',
    borderRadius: 10,
    padding: 6,
  },
  {
    key: 'category-grid',
    selector: '[data-coach="category-grid"]',
    title: '시술 직접 선택 등록',
    desc: '카테고리에서 시술을 선택하여\n하나씩 직접 등록할 수 있어요',
    borderRadius: 16,
    padding: 6,
  },
  {
    key: 'parse-button',
    selector: '[data-coach="parse-button"]',
    title: '텍스트 · 이미지로 한 번에 등록',
    desc: '카톡 대화, 메모, 영수증 사진으로\n여러 시술을 한 번에 등록해요',
    borderRadius: 12,
    padding: 6,
  },
  {
    key: 'cta',
    selector: '[data-coach="parse-button"]',
    title: '이전 시술 로그를\n한 번에 등록해볼까요? ✨',
    desc: '아래 버튼을 눌러보세요!',
    borderRadius: 12,
    padding: 6,
    isCTA: true,
  },
] as const;

const FabCoachmark = ({ open, onClose, onClickParse }: Props) => {
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const [dialogRect, setDialogRect] = useState<DOMRect | null>(null);

  // Reset step when coachmark opens/closes
  useEffect(() => {
    if (open) {
      setStepIdx(0);
      setRect(null);
    }
  }, [open]);

  const step = STEPS[stepIdx];

  const measure = useCallback(() => {
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
    } else {
      // Element not found — keep trying
      setRect(null);
    }
    const dialog = document.querySelector('[data-coach-container]');
    if (dialog) {
      setDialogRect(dialog.getBoundingClientRect());
    }
  }, [step]);

  useEffect(() => {
    if (!open) return;
    // Reset rect when step changes so we don't show stale spotlight
    setRect(null);
    // Measure with increasing delays to handle render timing
    const t1 = setTimeout(measure, 100);
    const t2 = setTimeout(measure, 300);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, stepIdx, measure]);

  const next = () => {
    if (stepIdx < STEPS.length - 1) {
      setStepIdx(prev => prev + 1);
    }
  };

  const skip = () => onClose();

  if (!open || !rect) return null;

  const isCTA = 'isCTA' in step && step.isCTA;
  const tooltipWidth = 290;
  const gap = 14;

  const spaceAbove = rect.top - (dialogRect?.top ?? 0);
  const spaceBelow = (dialogRect ? dialogRect.bottom : window.innerHeight) - (rect.top + rect.height);
  const placeAbove = spaceAbove > spaceBelow;

  const targetCenterX = rect.left + rect.width / 2;
  const minLeft = 16;
  const maxLeft = window.innerWidth - tooltipWidth - 16;
  let tooltipLeft = targetCenterX - tooltipWidth / 2;
  tooltipLeft = Math.max(minLeft, Math.min(maxLeft, tooltipLeft));
  const arrowLeft = targetCenterX - tooltipLeft;

  const tooltipStyle: React.CSSProperties = placeAbove
    ? {
        position: 'fixed',
        bottom: window.innerHeight - rect.top + gap,
        left: tooltipLeft,
        width: tooltipWidth,
        zIndex: 10010,
      }
    : {
        position: 'fixed',
        top: rect.top + rect.height + gap,
        left: tooltipLeft,
        width: tooltipWidth,
        zIndex: 10010,
      };

  return createPortal(
    <div className="fixed inset-0 z-[10000]" style={{ pointerEvents: 'auto' }}>
      {/* Dark overlay with cutout */}
      <svg className="fixed inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <mask id="fab-coach-mask">
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
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.7)" mask="url(#fab-coach-mask)" />
      </svg>

      {/* Spotlight glow */}
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
            zIndex: 10005,
          }}
        />
      )}

      {/* Click blocker */}
      <div
        className="fixed inset-0"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      />

      {/* Tooltip */}
      <div style={tooltipStyle} onClick={(e) => e.stopPropagation()}>
        <div className="bg-card rounded-2xl shadow-2xl border border-border/50 overflow-visible relative">
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 pt-3 pb-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === stepIdx ? 'w-5 bg-[#F2C94C]' : i < stepIdx ? 'w-1.5 bg-[#F2C94C]/50' : 'w-1.5 bg-muted'
                }`}
              />
            ))}
          </div>

          <div className="px-4 pt-2 pb-3 text-center space-y-1.5">
            <h3 className="text-sm font-bold text-foreground whitespace-pre-line">{step.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{step.desc}</p>
          </div>

          {/* Arrow */}
          {placeAbove ? (
            <div
              className="absolute -bottom-2 w-0 h-0"
              style={{
                left: arrowLeft,
                transform: 'translateX(-50%)',
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '8px solid hsl(var(--card))',
              }}
            />
          ) : (
            <div
              className="absolute -top-2 w-0 h-0"
              style={{
                left: arrowLeft,
                transform: 'translateX(-50%)',
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderBottom: '8px solid hsl(var(--card))',
              }}
            />
          )}

          {/* Actions */}
          <div className="px-4 pb-3">
            {isCTA ? (
              <div className="space-y-2">
                <Button
                  className="w-full rounded-xl h-10 text-sm font-bold bg-[#F2C94C] hover:bg-[#e0b83e] text-foreground"
                  onClick={() => {
                    onClose();
                    onClickParse();
                  }}
                >
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  텍스트 · 이미지로 등록하기
                </Button>
                <button
                  onClick={skip}
                  className="w-full text-center text-[11px] text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                  다음에 하기
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="flex-1 rounded-xl text-muted-foreground text-xs"
                  onClick={skip}
                >
                  건너뛰기
                </Button>
                <Button
                  className="flex-1 rounded-xl bg-[#F2C94C] hover:bg-[#e0b83e] text-foreground font-bold text-xs"
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

export default FabCoachmark;
