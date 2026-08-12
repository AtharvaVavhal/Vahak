import type { Metadata } from 'next';

import { AuthProvider } from '../auth';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vahak Admin',
  description: 'Vahak admin dashboard — routes, halts, buses, and consignment lookup.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-slate-50 text-slate-900 antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
