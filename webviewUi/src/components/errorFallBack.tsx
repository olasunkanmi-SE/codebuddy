export function ErrorFallBackComponent() {
  return (
    <div>
      <h1>Oops! Something went wrong.</h1>
      <p>Please try again later.</p>
    </div>
  );
}

interface ErrorBannerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any;
  onDismiss: React.MouseEventHandler<HTMLButtonElement>;
}

export function InlineErrorBanner({ error, onDismiss }: ErrorBannerProps) {
  if (!error) return null;

  return (
    <div className="inline-error-banner">
      <span>⚠️ {error.message}</span>
      <button onClick={onDismiss}>Dismiss</button>
    </div>
  );
}
