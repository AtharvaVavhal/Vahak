import type { ReactNode } from 'react';

export function EmptyState({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-16 text-center">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {subtitle ? <p className="max-w-sm text-sm text-slate-500">{subtitle}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
