import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

/** Canonical card surface: white on canvas, no shadow. Reuse instead of re-declaring the border/radius/padding pattern per page. */
export function Card({ title, children, className }: CardProps) {
  return (
    <div className={`rounded-md border border-ink-150 bg-surface p-5 ${className ?? ''}`}>
      {title ? <h2 className="mb-3 text-base font-bold text-ink-900">{title}</h2> : null}
      {children}
    </div>
  );
}
