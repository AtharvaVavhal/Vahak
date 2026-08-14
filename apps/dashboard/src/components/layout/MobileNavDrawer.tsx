'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { NAV_ITEMS } from '../../constants/nav';

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
}

/** `md:hidden` counterpart to the desktop Sidebar — the app has no other way to navigate below the `md` breakpoint. */
export function MobileNavDrawer({ open, onClose }: MobileNavDrawerProps) {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        aria-label="Close navigation"
        className="absolute inset-0 bg-ink-900/40"
        onClick={onClose}
      />
      <nav className="relative flex h-full w-64 flex-col gap-1 bg-surface p-3 shadow-overlay">
        <div className="px-2 py-3">
          <span className="text-lg font-bold text-ink-900">Vahak</span>
          <span className="ml-1 text-xs font-medium text-ink-500">Admin</span>
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-2 rounded-sm px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-tint text-brand' : 'text-ink-700 hover:bg-canvas'
              }`}
            >
              <Icon size={18} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
