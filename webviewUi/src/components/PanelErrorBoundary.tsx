import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallbackLabel?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class PanelErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[PanelErrorBoundary] ${this.props.fallbackLabel ?? "Panel"} crashed:`, error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            padding: 24,
            textAlign: "center",
            color: "var(--vscode-errorForeground, #f48771)",
            fontSize: 12,
          }}
        >
          <p style={{ fontWeight: 600, marginBottom: 8 }}>
            {this.props.fallbackLabel ?? "Panel"} encountered an error
          </p>
          <p style={{ opacity: 0.7, marginBottom: 12 }}>
            {this.state.error?.message}
          </p>
          <button
            onClick={this.handleRetry}
            style={{
              background: "var(--vscode-button-background)",
              color: "var(--vscode-button-foreground)",
              border: "none",
              borderRadius: 4,
              padding: "6px 16px",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
