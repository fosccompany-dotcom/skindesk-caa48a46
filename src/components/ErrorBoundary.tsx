import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6 text-center">
        <p className="text-lg font-medium text-foreground">
          오류가 발생했어요. 새로고침 해주세요
        </p>
        <p className="text-sm text-muted-foreground">
          Something went wrong. Please refresh.
        </p>
        <p className="text-sm text-muted-foreground">
          发生错误，请刷新页面。
        </p>
        <Button onClick={() => window.location.reload()} className="mt-2">
          새로고침 / Refresh
        </Button>
      </div>
    );
  }
}
