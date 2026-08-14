import { CircleAlert } from 'lucide-react';

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-sm border border-danger bg-danger-tint px-3 py-2 text-sm text-danger">
      <CircleAlert size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
