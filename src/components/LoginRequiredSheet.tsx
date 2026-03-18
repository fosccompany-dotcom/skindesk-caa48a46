import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
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
    email: '이메일',
    password: '비밀번호',
    login: '로그인',
    google: 'Google로 로그인',
    kakao: '카카오톡으로 로그인',
    signup: '회원가입',
    noAccount: '계정이 없으신가요?',
  },
  en: {
    title: 'Login Required',
    subtitle: 'Saving records, managing schedules,\nand personal settings require login',
    email: 'Email',
    password: 'Password',
    login: 'Login',
    google: 'Login with Google',
    kakao: 'Login with Kakao',
    signup: 'Sign Up',
    noAccount: "Don't have an account?",
  },
  zh: {
    title: '需要登录',
    subtitle: '保存记录、管理日程、个人设置\n需要登录后才能使用',
    email: '邮箱',
    password: '密码',
    login: '登录',
    google: '使用Google登录',
    kakao: '使用Kakao登录',
    signup: '注册',
    noAccount: '没有账号？',
  },
};

export default function LoginRequiredSheet({ open, onClose, onLoginSuccess }: LoginRequiredSheetProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const t = texts[language];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: error.message, variant: 'destructive' });
    } else {
      onLoginSuccess?.();
      onClose();
    }
  };

  const handleOAuth = async (provider: 'google' | 'kakao') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) toast({ title: error.message, variant: 'destructive' });
  };

  const handleSignup = () => {
    onClose();
    navigate('/signup');
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl px-6 pb-8 pt-6 max-h-[90vh] overflow-y-auto">
        {/* Logo */}
        <div className="flex justify-center mb-3">
          <img src={logoImg} alt="Bloom" className="w-16 h-16 animate-spin-slow opacity-90" />
        </div>

        {/* Title */}
        <h2 className="text-center text-lg font-bold text-foreground">{t.title}</h2>
        <p className="text-center text-sm text-muted-foreground mt-1.5 whitespace-pre-line leading-relaxed">
          {t.subtitle}
        </p>

        {/* Email/Password Form */}
        <form onSubmit={handleLogin} className="mt-5 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{t.email}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="pl-10 h-11 rounded-xl"
                placeholder="email@example.com"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t.password}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="pl-10 pr-10 h-11 rounded-xl"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full h-11 rounded-xl text-sm font-semibold" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            {t.login}
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Social Login */}
        <div className="space-y-2.5">
          <Button variant="outline" className="w-full h-11 rounded-xl text-sm font-medium gap-3" onClick={() => handleOAuth('google')}>
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {t.google}
          </Button>
          <Button variant="outline" className="w-full h-11 rounded-xl text-sm font-medium gap-3 bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#191919] border-[#FEE500]" onClick={() => handleOAuth('kakao')}>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#191919">
              <path d="M12 3C6.48 3 2 6.36 2 10.5c0 2.67 1.74 5.02 4.37 6.37-.14.51-.89 3.29-.92 3.49 0 0-.02.17.09.23.11.07.24.01.24.01.32-.04 3.7-2.44 4.28-2.86.62.09 1.27.13 1.94.13 5.52 0 10-3.36 10-7.5S17.52 3 12 3z"/>
            </svg>
            {t.kakao}
          </Button>
        </div>

        {/* Signup */}
        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">
            {t.noAccount}{' '}
            <button className="text-primary font-semibold" onClick={handleSignup}>
              {t.signup}
            </button>
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
