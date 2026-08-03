import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Top-level error boundary. Catches unexpected render errors so the
 * console never shows a blank screen; offers a recovery path.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Admin console render error:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <AlertTriangle className="mb-3 size-8 text-destructive" />
        <p className="text-sm font-medium text-destructive">Something went wrong rendering this view.</p>
        <p className="mt-1 max-w-md text-xs text-muted-foreground">{this.state.error.message}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => this.setState({ error: null })}
        >
          Try again
        </Button>
      </div>
    );
  }
}