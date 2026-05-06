import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import LoginRequiredSheet from '@/components/LoginRequiredSheet';

const PUBLIC_PATHS = ['/signup', '/farewell', '/privacy', '/terms', '/reset-password'];

const isPreview =
  typeof window !== 'undefined' &&
  (window.location.hostname.includes('preview--') ||
    window.location.hostname.includes('lovableproject.com'));

/**
 * 앱 시작 시 비로그인 상태이면 로그인/회원가입 시트를 자동으로 띄움.
 * 한 세션 동안은 닫으면 다시 뜨지 않음.
 */
export default function AppStartLoginGate() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (isPreview || loading || shown) return;
    if (user) return;
    if (PUBLIC_PATHS.includes(location.pathname)) return;
    if (sessionStorage.getItem('login_gate_dismissed') === '1') {
      setShown(true);
      return;
    }
    setOpen(true);
    setShown(true);
  }, [user, loading, location.pathname, shown]);

  const handleClose = () => {
    sessionStorage.setItem('login_gate_dismissed', '1');
    setOpen(false);
  };

  return (
    <LoginRequiredSheet
      open={open}
      onClose={handleClose}
      onLoginSuccess={() => setOpen(false)}
    />
  );
}
