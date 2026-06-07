import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

export class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, showDetails: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, showDetails: false };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[AdminErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const { error, showDetails } = this.state;

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Trang này gặp lỗi</h2>
        <p className="text-muted-foreground text-sm mb-6 max-w-md">
          {error?.message || 'Đã xảy ra lỗi không mong muốn. Thử tải lại trang hoặc kiểm tra kết nối Supabase.'}
        </p>
        <div className="flex gap-3 mb-4">
          <Button onClick={() => this.setState({ hasError: false, error: null, showDetails: false })}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Thử lại
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Tải lại trang
          </Button>
        </div>
        <button
          className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors"
          onClick={() => this.setState(s => ({ showDetails: !s.showDetails }))}
        >
          Chi tiết lỗi {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        {showDetails && error?.stack && (
          <pre className="mt-3 text-left text-xs bg-muted p-4 rounded-lg max-w-2xl w-full overflow-auto max-h-48 text-muted-foreground">
            {error.stack}
          </pre>
        )}
      </div>
    );
  }
}
