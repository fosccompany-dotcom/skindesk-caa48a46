/**
 * AdminRoute — 어드민 전용 라우트 가드
 *
 * 권한 판정을 서버(`rpc('is_admin')`)에만 맡긴다.
 * `adminAuth.ts`의 이메일 화이트리스트는 UI 표시용이며 권한 근거가 아니다 —
 * 클라이언트 번들 안의 문자열 비교라 신뢰할 수 없다.
 *
 * 로그인 여부는 PrivateRoute와 동일하게 처리하고, 그 위에 어드민 판정을 얹는다.
 */
import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  // null = 판정 전. 판정 전에 children을 그리면 안 된다.
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setIsAdmin(false);
      return;
    }

    let mounted = true;
    setIsAdmin(null);
    supabase
      .rpc('is_admin' as any)
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          console.error('AdminRoute: is_admin 조회 실패', error);
          setIsAdmin(false);
          return;
        }
        setIsAdmin(data === true);
      });

    return () => {
      mounted = false;
    };
  }, [user, loading]);

  if (loading || (user && isAdmin === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-[#C9A96E] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md p-8 text-center space-y-4">
          <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-bold">접근 권한 없음</h2>
          <p className="text-sm text-muted-foreground">
            이 페이지는 어드민 계정만 접근 가능합니다.<br />
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">admin_users</code> 테이블에 등록 필요.
          </p>
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> 홈으로
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
