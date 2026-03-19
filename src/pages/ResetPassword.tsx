import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Lock, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event from the auth state change
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
        setChecking(false);
      } else if (event === 'SIGNED_IN' && session) {
        // User might already be signed in via recovery token
        setReady(true);
        setChecking(false);
      }
    });

    // Also check URL hash for recovery token and existing session
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      // Supabase will process the token and fire PASSWORD_RECOVERY event
      // Just wait for it
      setTimeout(() => {
        if (!ready) {
          // Fallback: check session directly
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
              setReady(true);
            } else {
              toast({ title: '유효하지 않은 링크입니다', variant: 'destructive' });
              navigate('/login', { replace: true });
            }
            setChecking(false);
          });
        }
      }, 3000);
    } else {
      // No recovery token in URL — check existing session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setReady(true);
        } else {
          toast({ title: '유효하지 않은 링크입니다', variant: 'destructive' });
          navigate('/login', { replace: true });
        }
        setChecking(false);
      });
    }

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: '비밀번호는 6자 이상이어야 합니다', variant: 'destructive' });
      return;
    }
    if (password !== confirm) {
      toast({ title: '비밀번호가 일치하지 않습니다', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast({ title: error.message, variant: 'destructive' });
    } else {
      toast({ title: '비밀번호가 변경되었습니다' });
      navigate('/', { replace: true });
    }
  };

  // Loading state
  if (checking && !ready) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">인증 확인 중...</p>
      </div>
    );
  }

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-[380px] space-y-6">
        {/* Title — matching Login page style */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">비밀번호 재설정</h1>
          <p className="text-sm font-semibold tracking-[0.2em] text-[#C9A96E]">BLOOMLOG</p>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          새로운 비밀번호를 입력해주세요
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">새 비밀번호</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="pl-10 pr-10 h-11 rounded-xl"
                placeholder="6자 이상"
                required
                minLength={6}
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

          <div className="space-y-1.5">
            <Label className="text-xs">비밀번호 확인</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="pl-10 pr-10 h-11 rounded-xl"
                placeholder="비밀번호 재입력"
                required
                minLength={6}
              />
              {confirm && password === confirm && (
                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C9A96E]" />
              )}
            </div>
          </div>

          <Button type="submit" className="w-full h-11 rounded-xl text-sm font-semibold" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            비밀번호 변경
          </Button>
        </form>

        {/* Footer — back to login */}
        <div className="text-center">
          <button
            type="button"
            className="text-xs text-muted-foreground hover:underline underline-offset-2"
            onClick={() => navigate('/login')}
          >
            로그인으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
