import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { LocaleProvider } from './locale-provider';

const geist = localFont({
  src: '../../../node_modules/.pnpm/next@16.3.1_@babel+core@7.29.7_@types+node@26.2.0_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/next-devtools/server/font/geist-latin.woff2',
  display: 'swap',
  variable: '--font-geist',
});

export const metadata: Metadata = {
  title: 'CashTracker',
  description: 'Financial clarity without the noise.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={geist.variable}><LocaleProvider>{children}</LocaleProvider></body>
    </html>
  );
}
