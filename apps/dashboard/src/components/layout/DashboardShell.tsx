'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Button, LoadingSpinner } from '../ui';
import { useAuth } from '../../hooks';
import { UserRole } from '../../types';

/**
 * Gates every admin route: waits out session restoration, redirects unauthenticated
 * visitors to /login, and — since this dashboard is admin-only — shows a clear
 * permission error (not a silent redirect) for a successfully authenticated non-admin
 * account rather than rendering admin screens for them.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isBootstrapping, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isBootstrapping && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isBootstrapping, isAuthenticated, router]);

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoadingSpinner label="Restoring session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (user?.role !== UserRole.ADMIN) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
        <p className="text-lg font-semibold text-slate-900">This dashboard is for admin accounts only</p>
        <p className="max-w-md text-sm text-slate-500">
          You&apos;re signed in as a {user?.role.toLowerCase()}. Log out and sign in with an admin
          account to continue.
        </p>
        <Button
          label="Log out"
          onClick={() => {
            logout();
            router.replace('/login');
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
