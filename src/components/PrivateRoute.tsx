import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const isPreview =
  window.location.hostname.includes('preview') ||
  window.location.hostname.includes('lovableproject.com') ||
  window.location.hostname.includes('lovable.app');

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // Preview 환경에서는 인증 없이 통과
  if (isPreview) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-[#C9A96E] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
