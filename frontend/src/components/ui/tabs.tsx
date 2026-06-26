import { cn } from '@/lib/utils';

export interface TabDef { value: string; label: string }

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: TabDef[];
  active: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="border-b">
      <div className="flex gap-1">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => onChange(t.value)}
            className={cn(
              'relative px-4 py-2.5 text-sm font-medium transition-colors',
              active === t.value ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
            {active === t.value && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />}
          </button>
        ))}
      </div>
    </div>
  );
}
