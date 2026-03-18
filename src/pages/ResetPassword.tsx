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
  const [valid, setValid] = useState(false);

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setValid(true);
    } else {
      // Also check if user has an active session from recovery
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setValid(true);
        } else {
          toast({ title: '유효하지 않은 링크입니다', variant: 'destructive' });
          navigate('/login', { replace: true });
        }
      });
    }
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

  if (!valid) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-[380px] space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold text-foreground">비밀번호 재설정</h1>
          <p className="text-sm text-muted-foreground">새 비밀번호를 입력해주세요</p>
        </div>

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
                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accent" />
              )}
            </div>
          </div>

          <Button type="submit" className="w-full h-11 rounded-xl text-sm font-semibold" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            비밀번호 변경
          </Button>
        </form>
      </div>
    </div>
  );
}
