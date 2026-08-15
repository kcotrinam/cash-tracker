import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CashTracker',
  description: 'Tus finanzas mensuales, con claridad.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
