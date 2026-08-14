'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { NAV_ITEMS } from '../../constants/nav';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 border-r border-ink-150 bg-surface md:flex md:flex-col">
      <div className="px-5 py-5">
        <span className="text-lg font-bold text-ink-900">Vahak</span>
        <span className="ml-1 text-xs font-medium text-ink-500">Admin</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
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
    </aside>
  );
}
