'use client';

import type { InputHTMLAttributes } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
}

export function TextField({ label, error, className, id, ...rest }: TextFieldProps) {
  const inputId = id ?? `field-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-[13px] leading-[18px] font-semibold text-ink-900">
        {label}
      </label>
      <input
        id={inputId}
        className={`h-10 rounded-sm border bg-surface px-3 text-[15px] leading-[21px] text-ink-900 placeholder:text-ink-500 focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/20 disabled:bg-canvas disabled:text-ink-500 ${
          error ? 'border-danger' : 'border-ink-300'
        } ${className ?? ''}`}
        {...rest}
      />
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
