import React, { ErrorInfo } from "react";
import { InlineErrorBanner } from "./errorFallBack";

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render shows the error toast
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Error caught by boundary:", error);
    console.error("Error Info:", errorInfo);

    // Update state with full error info
    this.setState({
      error,
      errorInfo,
    });

    // Optional: Send error to VS Code extension host for logging
    // vscode.postMessage({
    //   type: 'error',
    //   error: error.message,
    //   stack: error.stack,
    // });
  }

  handleDismissError = () => {
    this.setState({
      error: null,
      errorInfo: null,
    });
  };

  render() {
    const { error } = this.state;
    const { children } = this.props;

    return (
      <>
        {/* Always render children - UI stays intact */}
        {children}

        {/* Show error toast overlay when there's an error */}
        <InlineErrorBanner error={error} onDismiss={this.handleDismissError} />
      </>
    );
  }
}
