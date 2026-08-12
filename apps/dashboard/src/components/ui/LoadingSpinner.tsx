export function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
      {label ? <p className="text-sm">{label}</p> : null}
    </div>
  );
}
