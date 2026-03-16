import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { Mail, Lock, User, Loader2, Eye, EyeOff, ExternalLink, ArrowLeft } from 'lucide-react';

const Signup = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const allAgreed = agreeTerms && agreePrivacy;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: '비밀번호는 6자리 이상이어야 합니다', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: '비밀번호가 일치하지 않습니다', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}?onboarding=true`,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: error.message, variant: 'destructive' });
    } else if (data.user) {
      await supabase.from('user_profiles').upsert({
        id: data.user.id,
        privacy_agreed_at: new Date().toISOString(),
      });
      if (data.session) {
        navigate('/?onboarding=true');
      } else {
        toast({ title: '가입 확인 이메일을 보냈습니다. 이메일을 확인해주세요.' });
        navigate('/login');
      }
    }
  };

  const handleOAuth = async (provider: 'google' | 'kakao') => {
    if (!allAgreed) {
      toast({ title: '필수 약관에 동의해주세요', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: 'https://skindesk.lovable.app?onboarding=true&privacy_agreed=true' },
    });
    if (error) toast({ title: error.message, variant: 'destructive' });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5">
      <div className="w-full max-w-[380px] space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{t('auth_signup_title')}</h1>
          <p className="text-sm font-semibold tracking-[0.2em] text-[#C9A96E]">SKINDESK</p>
        </div>

        {/* Social */}
        <div className="space-y-2.5">
          <Button variant="outline" className="w-full h-12 rounded-xl text-sm font-medium gap-3" onClick={() => handleOAuth('google')}>
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google로 시작하기
          </Button>
          <Button variant="outline" className="w-full h-12 rounded-xl text-sm font-medium gap-3 bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#191919] border-[#FEE500]" onClick={() => handleOAuth('kakao')}>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#191919">
              <path d="M12 3C6.48 3 2 6.36 2 10.5c0 2.67 1.74 5.02 4.37 6.37-.14.51-.89 3.29-.92 3.49 0 0-.02.17.09.23.11.07.24.01.24.01.32-.04 3.7-2.44 4.28-2.86.62.09 1.27.13 1.94.13 5.52 0 10-3.36 10-7.5S17.52 3 12 3z"/>
            </svg>
            카카오로 시작하기
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">{t('auth_or')}</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleSignup} className="space-y-3">
          {/* 이름 */}
          <div className="space-y-1.5">
            <Label className="text-xs">이름 (닉네임)</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="text" value={name} onChange={e => setName(e.target.value)} className="pl-10 h-11 rounded-xl" placeholder="홍길동" required />
            </div>
          </div>
          {/* 이메일 */}
          <div className="space-y-1.5">
            <Label className="text-xs">{t('auth_email')}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="pl-10 h-11 rounded-xl" placeholder="email@example.com" required />
            </div>
          </div>
          {/* 비밀번호 */}
          <div className="space-y-1.5">
            <Label className="text-xs">{t('auth_password')}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="pl-10 pr-10 h-11 rounded-xl" placeholder="••••••••" required minLength={6} />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {/* 비밀번호 확인 */}
          <div className="space-y-1.5">
            <Label className="text-xs">{t('auth_password_confirm')}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="pl-10 pr-10 h-11 rounded-xl" placeholder="••••••••" required minLength={6} />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* 약관 동의 */}
          <div className="space-y-2.5 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={agreeTerms} onCheckedChange={(v) => setAgreeTerms(!!v)} className="mt-0.5" />
              <span className="text-xs text-foreground leading-tight flex-1">
                [필수] 이용약관 동의
                <Link to="/terms" className="ml-1 text-primary underline" onClick={(e) => e.stopPropagation()}>
                  <ExternalLink className="h-3 w-3 inline ml-0.5" />
                </Link>
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={agreePrivacy} onCheckedChange={(v) => setAgreePrivacy(!!v)} className="mt-0.5" />
              <span className="text-xs text-foreground leading-tight flex-1">
                [필수] 개인정보처리방침 동의
                <Link to="/privacy" className="ml-1 text-primary underline" onClick={(e) => e.stopPropagation()}>
                  <ExternalLink className="h-3 w-3 inline ml-0.5" />
                </Link>
              </span>
            </label>
          </div>

          <Button
            type="submit"
            className="w-full h-11 rounded-xl text-sm font-semibold"
            disabled={loading || !allAgreed}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {t('signup')}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {t('auth_has_account')}{' '}
            <button className="text-primary font-semibold" onClick={() => navigate('/login')}>
              {t('login')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
