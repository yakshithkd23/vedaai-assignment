'use client';

export default function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface">
      <div className="animate-pulse text-primary">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l1.8 5.6L19 9.5l-5.2 1.9L12 17l-1.8-5.6L5 9.5l5.2-1.9L12 2z" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-ink">{message}</p>
        <p className="mt-1 text-sm text-ink-faint">This may take a while</p>
      </div>
    </div>
  );
}
