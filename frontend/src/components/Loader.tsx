import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';

/** Small inline spinner (buttons, inline waits). */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent',
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

/**
 * Branded loader for AgroJatra ERP — the name means "forward journey / progress",
 * so the mark is an upward arrow climbing inside a rotating progress ring.
 */
export function BrandLoader({
  label = 'Loading',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center gap-5', className)}>
      <div className="relative h-20 w-20">
        {/* rotating progress ring */}
        <svg className="absolute inset-0 h-full w-full animate-spin [animation-duration:1.2s]" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="44" stroke="hsl(var(--muted))" strokeWidth="6" />
          <circle
            cx="50" cy="50" r="44" stroke="url(#ajx-grad)" strokeWidth="6" strokeLinecap="round"
            strokeDasharray="80 200"
          />
          <defs>
            <linearGradient id="ajx-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#14B8A6" />
            </linearGradient>
          </defs>
        </svg>
        {/* monogram with a climbing arrow (progress / moving forward) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {/* ascending bars + forward arrow = progress */}
              <path d="M5 19V13" className="origin-bottom animate-pulse [animation-delay:0ms]" />
              <path d="M12 19V9" className="origin-bottom animate-pulse [animation-delay:150ms]" />
              <path d="M19 19V5" className="origin-bottom animate-pulse [animation-delay:300ms]" />
              <path d="M14 5h5v5" />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center text-center">
        <Logo className="h-6" />
        <p className="mt-2 text-xs text-muted-foreground">{label}…</p>
      </div>

      {/* indeterminate progress bar */}
      <div className="relative h-1 w-40 overflow-hidden rounded-full bg-muted">
        <div className="ajx-progress absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
      </div>
    </div>
  );
}

/** Full-screen branded splash shown while the app boots / loads. */
export function BrandSplash({ label }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
      <BrandLoader label={label} />
    </div>
  );
}
