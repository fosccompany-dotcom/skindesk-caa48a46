import { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';

export function useLoginGuard() {
  const { user } = useAuth();
  const [showLoginSheet, setShowLoginSheet] = useState(false);
  const pendingAction = useRef<(() => void) | null>(null);

  const guardAction = useCallback((action: () => void) => {
    if (user) {
      action();
    } else {
      pendingAction.current = action;
      setShowLoginSheet(true);
    }
  }, [user]);

  const handleLoginSuccess = useCallback(() => {
    pendingAction.current?.();
    pendingAction.current = null;
  }, []);

  const handleClose = useCallback(() => {
    setShowLoginSheet(false);
    pendingAction.current = null;
  }, []);

  return { showLoginSheet, guardAction, handleLoginSuccess, handleClose };
}
