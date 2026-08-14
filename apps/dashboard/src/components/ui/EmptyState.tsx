import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function EmptyState({
  title,
  subtitle,
  action,
  icon: Icon,
  compact = false,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  /** Contextual icon (e.g. Inbox, Route) — decorative context, not filler. */
  icon?: LucideIcon;
  /** Smaller, borderless treatment for use inside an existing card/section rather than as a full page state. */
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? 'flex flex-col items-center justify-center gap-1 py-6 text-center'
          : 'flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-ink-300 py-16 text-center'
      }
    >
      {Icon ? (
        <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-canvas">
          <Icon size={22} strokeWidth={1.75} className="text-ink-500" />
        </div>
      ) : null}
      <p className={compact ? 'text-sm text-ink-500' : 'text-sm font-semibold text-ink-700'}>{title}</p>
      {subtitle ? <p className="max-w-sm text-sm text-ink-500">{subtitle}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
