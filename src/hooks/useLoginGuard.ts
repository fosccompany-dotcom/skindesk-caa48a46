import { useState, useCallback, useRef } from 'react';

/**
 * 로그인은 앱 최초 진입(AppStartLoginGate)에서만 요구한다.
 * 그 외의 모든 액션은 로그인 여부와 무관하게 즉시 실행되므로
 * 이 훅은 호환성을 위해 동일한 시그니처를 유지하되, 실제 가드는 수행하지 않는다.
 */
export function useLoginGuard() {
  const [showLoginSheet, setShowLoginSheet] = useState(false);
  const pendingAction = useRef<(() => void) | null>(null);

  const guardAction = useCallback((action: () => void) => {
    action();
  }, []);

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
