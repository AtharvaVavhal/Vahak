export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-ink-150 py-2 last:border-b-0">
      <span className="text-sm text-ink-500">{label}</span>
      <span className="text-right text-sm font-medium text-ink-900">{value}</span>
    </div>
  );
}
