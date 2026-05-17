import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'XCM0102 Match Lab',
  description: 'A modern online CM0102-inspired match simulation lab.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
