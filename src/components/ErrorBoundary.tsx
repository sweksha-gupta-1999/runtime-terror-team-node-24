import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface Props {
  children: ReactNode;
  resetKey?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Route crashed', error, info);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="mx-auto max-w-2xl py-12">
        <Card>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-display text-xl font-semibold">Something went wrong</h1>
              <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">
                This screen crashed, but you can recover without losing the whole app.
              </p>
              <p className="mt-3 rounded-xl bg-ink-50 p-3 font-mono text-xs text-ink-600 dark:bg-ink-900 dark:text-ink-300">
                {this.state.error.message || 'Unknown error'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={() => this.setState({ error: null })}>
                  <RotateCcw className="h-4 w-4" /> Try again
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Reload app
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }
}

export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <ErrorBoundary resetKey={`${location.pathname}${location.search}`}>
      {children}
    </ErrorBoundary>
  );
}
