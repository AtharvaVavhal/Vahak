export function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-500">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-ink-300 border-t-brand" />
      {label ? <p className="text-sm">{label}</p> : null}
    </div>
  );
}
