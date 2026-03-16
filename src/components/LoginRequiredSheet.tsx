import { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import logoImg from '@/assets/logo_transparent.png';

interface LoginRequiredSheetProps {
  open: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

const texts = {
  ko: {
    title: '로그인이 필요해요',
    subtitle: '기록 저장, 일정 관리, 나만의 설정은\n로그인 후 이용할 수 있어요',
    termsAgree: '[필수] 이용약관 동의',
    privacyAgree: '[필수] 개인정보처리방침 동의',
    googleStart: 'Google로 시작하기',
    later: '나중에 할게요',
  },
  en: {
    title: 'Login Required',
    subtitle: 'Saving records, managing schedules,\nand personal settings require login',
    termsAgree: '[Required] Agree to Terms of Service',
    privacyAgree: '[Required] Agree to Privacy Policy',
    googleStart: 'Start with Google',
    later: 'Maybe later',
  },
  zh: {
    title: '需要登录',
    subtitle: '保存记录、管理日程、个人设置\n需要登录后才能使用',
    termsAgree: '[必须] 同意使用条款',
    privacyAgree: '[必须] 同意隐私政策',
    googleStart: '使用Google开始',
    later: '稍后再说',
  },
};

export default function LoginRequiredSheet({ open, onClose, onLoginSuccess }: LoginRequiredSheetProps) {
  const { language } = useLanguage();
  const t = texts[language];
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  const allAgreed = termsAgreed && privacyAgreed;

  const handleGoogleLogin = async () => {
    const redirectUrl = `${window.location.origin}?privacy_agreed=true`;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl },
    });
    onLoginSuccess?.();
    onClose();
  };

  const handleClose = () => {
    setTermsAgreed(false);
    setPrivacyAgreed(false);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl px-6 pb-8 pt-6">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img
            src={logoImg}
            alt="Bloom"
            className="w-20 h-20 animate-spin-slow opacity-90"
          />
        </div>

        {/* Title */}
        <h2 className="text-center text-lg font-bold text-foreground">{t.title}</h2>
        <p className="text-center text-sm text-muted-foreground mt-2 whitespace-pre-line leading-relaxed">
          {t.subtitle}
        </p>

        {/* Checkboxes */}
        <div className="mt-6 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox checked={termsAgreed} onCheckedChange={(v) => setTermsAgreed(!!v)} />
            <span className="text-sm text-foreground flex-1">
              {t.termsAgree}
              <Link to="/terms" className="ml-1 text-primary underline text-xs" onClick={(e) => e.stopPropagation()}>
                {'→'}
              </Link>
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox checked={privacyAgreed} onCheckedChange={(v) => setPrivacyAgreed(!!v)} />
            <span className="text-sm text-foreground flex-1">
              {t.privacyAgree}
              <Link to="/privacy" className="ml-1 text-primary underline text-xs" onClick={(e) => e.stopPropagation()}>
                {'→'}
              </Link>
            </span>
          </label>
        </div>

        {/* Google Login Button */}
        <Button
          className="w-full mt-6 h-12 text-base font-semibold rounded-xl"
          disabled={!allAgreed}
          onClick={handleGoogleLogin}
        >
          {t.googleStart}
        </Button>

        {/* Later */}
        <button
          className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          onClick={handleClose}
        >
          {t.later}
        </button>
      </SheetContent>
    </Sheet>
  );
}
