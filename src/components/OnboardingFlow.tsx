import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Plus, Home, List, Package, Calendar, User, CreditCard, Settings, Sparkles } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

const STEPS = [
  'fab',
  'nav',
  'profile',
  'payment',
  'finish',
] as const;
type Step = typeof STEPS[number];

const OnboardingFlow = ({ open, onClose }: Props) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('fab');

  const currentIdx = STEPS.indexOf(step);
  const isLast = step === 'finish';

  const next = () => {
    if (isLast) return;
    setStep(STEPS[currentIdx + 1]);
  };

  const skip = () => {
    onClose();
  };

  const goToProfile = () => {
    onClose();
    navigate('/profile');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[380px] rounded-2xl p-0 gap-0 overflow-hidden border-0 shadow-2xl">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 pt-5 pb-2">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentIdx ? 'w-6 bg-[#F2C94C]' : i < currentIdx ? 'w-1.5 bg-[#F2C94C]/50' : 'w-1.5 bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Step: FAB */}
        {step === 'fab' && (
          <div className="p-6 space-y-5">
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-full bg-[#F2C94C] flex items-center justify-center shadow-lg shadow-[#F2C94C]/30">
                <Plus className="w-7 h-7 text-[#E87461] stroke-[2.5]" />
              </div>
              <h2 className="text-lg font-bold text-foreground">시술 기록 버튼</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                화면 오른쪽 하단의 <span className="font-semibold text-[#F2C94C]">+ 버튼</span>을 눌러<br />
                시술 기록을 추가할 수 있어요.
              </p>
            </div>
            <div className="bg-muted/40 rounded-2xl p-4 space-y-2">
              <div className="flex items-start gap-3">
                <span className="text-lg">📝</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">직접 입력</p>
                  <p className="text-[11px] text-muted-foreground">시술명, 병원, 금액 등을 직접 기록</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">📋</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">텍스트 붙여넣기</p>
                  <p className="text-[11px] text-muted-foreground">카톡·메모 텍스트로 자동 파싱</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step: Nav */}
        {step === 'nav' && (
          <div className="p-6 space-y-5">
            <div className="text-center space-y-2">
              <h2 className="text-lg font-bold text-foreground">하단 네비게이션</h2>
              <p className="text-sm text-muted-foreground">
                아래 탭으로 주요 기능을 이동해요
              </p>
            </div>
            <div className="space-y-2.5">
              {[
                { icon: Home, label: '홈', desc: '관리 현황과 다음 시술 한눈에 보기', color: 'bg-blue-50 text-blue-600' },
                { icon: List, label: '리스트', desc: '시술 기록 & 주기 관리', color: 'bg-emerald-50 text-emerald-600' },
                { icon: Package, label: '시술권', desc: '시술권·포인트·결제 관리', color: 'bg-amber-50 text-amber-600' },
                { icon: Calendar, label: '캘린더', desc: '시술 일정을 달력으로 확인', color: 'bg-purple-50 text-purple-600' },
                { icon: User, label: '마이', desc: '개인 설정 & 피부 프로필', color: 'bg-rose-50 text-rose-600' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 bg-muted/30 rounded-xl px-3 py-2.5">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.color}`}>
                    <item.icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step: Profile (마이페이지) */}
        {step === 'profile' && (
          <div className="p-6 space-y-5">
            <div className="text-center space-y-3">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center">
                <Settings className="w-7 h-7 text-rose-500" />
              </div>
              <h2 className="text-lg font-bold text-foreground">마이 페이지</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                개인 피부 정보와 관리 설정을<br />마이 페이지에서 관리해요
              </p>
            </div>
            <div className="bg-muted/40 rounded-2xl p-4 space-y-2.5">
              {[
                { emoji: '🧴', title: '피부 타입', desc: '건성·지성·복합성 등 피부 타입 설정' },
                { emoji: '🎯', title: '관리 목표', desc: '모공, 탄력, 주름 등 목표 관리' },
                { emoji: '🌿', title: '관리 시즌', desc: 'Reset·Recovery·Boost 등 시즌 설정' },
                { emoji: '📍', title: '관심 지역', desc: '병원 검색 시 우선 표시할 지역' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <span className="text-base">{item.emoji}</span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step: Payment */}
        {step === 'payment' && (
          <div className="p-6 space-y-5">
            <div className="text-center space-y-3">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
                <CreditCard className="w-7 h-7 text-amber-500" />
              </div>
              <h2 className="text-lg font-bold text-foreground">결제 기록 관리</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                시술비 결제 내역과 포인트를<br />한 곳에서 관리할 수 있어요
              </p>
            </div>
            <div className="bg-muted/40 rounded-2xl p-4 space-y-2.5">
              {[
                { emoji: '💳', title: '결제 내역', desc: '병원별 결제 금액과 방법 기록' },
                { emoji: '🪙', title: '포인트 충전', desc: '병원 포인트 충전·사용 내역 관리' },
                { emoji: '🎫', title: '시술권', desc: '시술권 잔여 횟수 & 만료일 추적' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <span className="text-base">{item.emoji}</span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step: Finish */}
        {step === 'finish' && (
          <div className="p-6 space-y-5">
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-[#F2C94C] to-[#E87461] flex items-center justify-center shadow-lg">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-lg font-bold text-foreground">준비 완료! 🎉</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                이제 나만의 피부 관리를 시작해보세요.<br />
                먼저 마이 정보를 등록하시겠어요?
              </p>
            </div>
            <div className="space-y-2 pt-1">
              <Button
                className="w-full rounded-xl h-12 text-sm font-bold bg-[#F2C94C] hover:bg-[#e0b83e] text-foreground"
                onClick={goToProfile}
              >
                마이 정보 등록하기 →
              </Button>
              <Button
                variant="ghost"
                className="w-full rounded-xl h-10 text-sm text-muted-foreground"
                onClick={onClose}
              >
                나중에 할게요
              </Button>
            </div>
          </div>
        )}

        {/* Bottom actions (not on finish step) */}
        {!isLast && (
          <div className="flex gap-2 px-6 pb-6">
            <Button variant="ghost" className="flex-1 rounded-xl text-muted-foreground" onClick={skip}>
              건너뛰기
            </Button>
            <Button className="flex-1 rounded-xl bg-[#F2C94C] hover:bg-[#e0b83e] text-foreground font-bold" onClick={next}>
              다음
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingFlow;
