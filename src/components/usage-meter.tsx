import { cn } from '@/lib/utils';
import type { Usage } from '@/lib/types';

export function UsageMeter({ label, usage }: { label: string; usage: Usage }) {
  const pct = usage.limit ? Math.min(100, (usage.used / usage.limit) * 100) : 0;
  const atLimit = usage.limit !== null && usage.used >= usage.limit;
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={cn('text-muted-foreground', atLimit && 'font-medium text-destructive')}>
          {usage.used} / {usage.limit ?? '∞'}
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="meter"
        aria-label={label}
        aria-valuenow={usage.used}
        aria-valuemin={0}
        aria-valuemax={usage.limit ?? usage.used}
      >
        <div className={cn('h-full rounded-full bg-primary transition-all', atLimit && 'bg-destructive')} style={{ width: usage.limit ? `${pct}%` : '6%' }} />
      </div>
    </div>
  );
}
