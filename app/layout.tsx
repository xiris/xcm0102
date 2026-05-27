import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'XCM0102 Manager Console',
  description: 'A modern online football manager console with head-to-head cockpit and simulation lab modes.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
