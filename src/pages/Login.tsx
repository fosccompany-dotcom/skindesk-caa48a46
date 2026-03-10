import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { LANGUAGE_LABELS } from '@/i18n/translations';
import type { Language } from '@/i18n/translations';
import { toast } from '@/hooks/use-toast';
import { Mail, Lock, Loader2 } from 'lucide-react';

const Login = () => {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: error.message, variant: 'destructive' });
    } else {
      navigate('/');
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://gaharylmkilooukxnipk.supabase.co/auth/v1/callback'
      }
    });
    if (error) toast({ title: error.message, variant: 'destructive' });
  };

  const handleKakaoLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: 'https://gaharylmkilooukxnipk.supabase.co/auth/v1/callback'
      }
    });
    if (error) toast({ title: error.message, variant: 'destructive' });
  };

  const LANGUAGES: Language[] = ['ko', 'en', 'zh'];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
      {/* Language Selector — top */}
      <div className="flex gap-1 mb-8">
        {LANGUAGES.map((lang) => (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              language === lang
                ? 'bg-[#C9A96E] text-white shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {LANGUAGE_LABELS[lang]}
          </button>
        ))}
      </div>

      <div className="w-full max-w-[380px] space-y-6">
        {/* Title */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{t('auth_login_title')}</h1>
          <p className="text-sm font-semibold tracking-[0.2em] text-[#C9A96E]">SKINDESK</p>
        </div>

        {/* Social Login */}
        <div className="space-y-2.5">
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl text-sm font-medium gap-3"
            onClick={handleGoogleLogin}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {t('auth_google')}
          </Button>
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl text-sm font-medium gap-3 bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#191919] border-[#FEE500]"
            onClick={handleKakaoLogin}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#191919">
              <path d="M12 3C6.48 3 2 6.36 2 10.5c0 2.67 1.74 5.02 4.37 6.37-.14.51-.89 3.29-.92 3.49 0 0-.02.17.09.23.11.07.24.01.24.01.32-.04 3.7-2.44 4.28-2.86.62.09 1.27.13 1.94.13 5.52 0 10-3.36 10-7.5S17.52 3 12 3z"/>
            </svg>
            {t('auth_kakao')}
          </Button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">{t('auth_or')}</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Email Login Form */}
        <form onSubmit={handleLogin} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{t('auth_email')}</Label>
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
            <Label className="text-xs">{t('auth_password')}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="pl-10 h-11 rounded-xl"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full h-11 rounded-xl text-sm font-semibold" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('login')}
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {t('auth_no_account')}{' '}
            <button className="text-primary font-semibold" onClick={() => navigate('/signup')}>
              {t('signup')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
