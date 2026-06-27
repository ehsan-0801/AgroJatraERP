import { cn } from '@/lib/utils';

/**
 * AgroJatra ERP wordmark. Shows the standard logo in light mode and the
 * inverted (white) variant in dark mode. Pass height via className, e.g. `h-8`.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <>
      <img src="/logo.png" alt="AgroJatra ERP" className={cn('logo-light w-auto', className)} />
      <img src="/logo-dark.png" alt="AgroJatra ERP" className={cn('logo-dark w-auto', className)} />
    </>
  );
}
