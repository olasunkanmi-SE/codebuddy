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
