'use client';

import type { ReactNode } from 'react';

import { DashboardShell } from '../../components/layout';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
