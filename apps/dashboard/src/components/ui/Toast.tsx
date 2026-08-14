'use client';

import { CircleCheckBig, CircleAlert } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface Toast {
  id: number;
  message: string;
  variant: 'success' | 'error';
}

interface ToastContextValue {
  showToast: (message: string, variant?: Toast['variant']) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const AUTO_DISMISS_MS = 4000;

/** App-wide success/error notifications for actions that otherwise give no visible feedback (e.g. a modal just closing). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: Toast['variant'] = 'success') => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex w-full max-w-sm items-center gap-2 rounded-md border px-4 py-3 text-sm font-medium shadow-overlay ${
              toast.variant === 'success'
                ? 'border-success/30 bg-success-tint text-success'
                : 'border-danger/30 bg-danger-tint text-danger'
            }`}
          >
            {toast.variant === 'success' ? (
              <CircleCheckBig size={16} strokeWidth={2} className="shrink-0" />
            ) : (
              <CircleAlert size={16} strokeWidth={2} className="shrink-0" />
            )}
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}
