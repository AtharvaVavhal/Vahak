'use client';

import { useRouter } from 'next/navigation';

import { Button } from '../ui';
import { useAuth } from '../../hooks';

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
      <div className="md:hidden text-base font-bold text-slate-900">Vahak Admin</div>
      <div className="hidden md:block" />
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-slate-900">{user?.name}</p>
          <p className="text-xs text-slate-500">{user?.phone}</p>
        </div>
        <Button label="Log out" variant="secondary" onClick={handleLogout} />
      </div>
    </header>
  );
}
