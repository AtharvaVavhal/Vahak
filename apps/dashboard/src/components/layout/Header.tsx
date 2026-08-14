'use client';

import { Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '../ui';
import { useAuth } from '../../hooks';

interface HeaderProps {
  onMenuPress?: () => void;
}

export function Header({ onMenuPress }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-ink-150 bg-surface px-4 md:px-6">
      <div className="flex items-center gap-3 md:hidden">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onMenuPress}
          className="flex h-9 w-9 items-center justify-center rounded-sm text-ink-500 hover:bg-canvas"
        >
          <Menu size={20} strokeWidth={2} />
        </button>
        <span className="text-base font-bold text-ink-900">Vahak Admin</span>
      </div>
      <div className="hidden md:block" />
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-ink-900">{user?.name}</p>
          <p className="text-xs text-ink-500">{user?.phone}</p>
        </div>
        <Button label="Log out" variant="secondary" onClick={handleLogout} />
      </div>
    </header>
  );
}
