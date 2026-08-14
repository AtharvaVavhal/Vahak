import type { Metadata } from 'next';

import { AuthProvider } from '../auth';
import { ToastProvider } from '../components/ui';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vahak Admin',
  description: 'Vahak admin dashboard — routes, halts, buses, and consignment lookup.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-canvas text-ink-900 antialiased">
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
