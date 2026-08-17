'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { MouseEvent, ReactNode } from 'react';
import { authenticatedFetch, getApiUrl, SessionExpiredError } from '../authenticated-fetch';

export type AppIconName =
  | 'dashboard'
  | 'wallet'
  | 'utensils'
  | 'car'
  | 'bolt'
  | 'dots'
  | 'receipt'
  | 'plus'
  | 'settings'
  | 'menu'
  | 'repeat';

const iconPaths: Record<AppIconName, string> = {
  dashboard: 'M4 4h6v6H4V4Zm10 0h6v10h-6V4ZM4 14h6v6H4v-6Zm10 4v-4h6v6h-6v-2Z',
  wallet:
    'M4 7h15a2 2 0 0 1 2 2v9H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h13v2H5v10h14v-5h-5V9h5V7H4Z',
  utensils: 'M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 3v18M14 3c0 4 1 6 3 6s3-2 3-6',
  car: 'm5 11 2-5h10l2 5v7H5v-7Zm2 5h.01M17 16h.01M5 11h14',
  bolt: 'm13 2-8 12h6l-1 8 9-13h-6l0-7Z',
  dots: 'M6 12h.01M12 12h.01M18 12h.01',
  receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6M9 12h6M9 16h4',
  plus: 'M12 5v14M5 12h14',
  settings:
    'M12 3v3m0 12v3M3 12h3m12 0h3m-2.6-6.6-2.1 2.1M5.7 18.3l2.1-2.1m0-8.4-2.1-2.1m12.6 12.6-2.1-2.1M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  menu: 'M4 7h16M4 12h16M4 17h16',
  repeat: 'M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3m13-3v2a4 4 0 0 1-4 4H4',
};

export function AppIcon({ name }: { name: AppIconName }) {
  return (
    <svg aria-hidden="true" className="size-5 shrink-0 fill-none stroke-current" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
      <path d={iconPaths[name]} />
    </svg>
  );
}

export type AppShellPage = 'dashboard' | 'transactions' | 'new';

const navigationItems: { href: string; icon: AppIconName; id: AppShellPage; label: string }[] = [
  { href: '/dashboard', icon: 'dashboard', id: 'dashboard', label: 'Dashboard' },
  { href: '/transactions', icon: 'receipt', id: 'transactions', label: 'Movimientos' },
  { href: '/transactions/new', icon: 'plus', id: 'new', label: 'Añadir movimiento' },
];

const comingSoonItems: { icon: AppIconName; label: string }[] = [
  { icon: 'repeat', label: 'Recurrentes' },
  { icon: 'settings', label: 'Configuración' },
];

export function AppShell({ active, children, screenClassName }: { active: AppShellPage; children: ReactNode; screenClassName: string }) {
  const router = useRouter();

  async function navigate(event: MouseEvent<HTMLAnchorElement>, href: string, selected: boolean) {
    if (
      selected ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey
    )
      return;

    event.preventDefault();
    try {
      await authenticatedFetch(`${getApiUrl()}/auth/me`);
    } catch (error) {
      if (error instanceof SessionExpiredError) return;
    }
    router.push(href);
  }

  return (
    <div className={`${screenClassName} min-h-[100dvh] bg-[var(--background)] text-[var(--foreground)]`}>
      <aside className="group fixed inset-y-0 left-0 z-30 hidden w-20 overflow-hidden border-r border-[var(--border)] bg-[var(--surface-lowest)] px-3 py-5 transition-[width] duration-300 ease-out hover:w-60 focus-within:w-60 md:flex md:flex-col">
        <Link className="flex h-12 min-w-[216px] items-center gap-4" href="/dashboard">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]"><AppIcon name="wallet" /></span>
          <span className="whitespace-nowrap text-sm font-semibold tracking-[-0.02em] opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">CashTracker</span>
        </Link>
        <nav aria-label="Navegación principal" className="mt-10 min-w-[216px] space-y-2">
          {navigationItems.map((item) => {
            const selected = item.id === active;
            return (
              <Link aria-current={selected ? 'page' : undefined} className={`flex h-12 w-12 items-center rounded-lg px-[14px] text-[var(--muted-foreground)] transition-[width,background-color,color] duration-300 ease-out hover:w-full hover:bg-[var(--surface-low)] hover:text-[var(--foreground)] group-hover:w-full group-focus-within:w-full ${selected ? 'bg-[var(--nav-active)] text-[var(--foreground)] hover:bg-[var(--nav-active)]' : ''}`} href={item.href} key={item.id} onClick={(event) => void navigate(event, item.href, selected)} title={item.label}>
                <AppIcon name={item.icon} />
                <span className="ml-4 whitespace-nowrap text-sm font-medium opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">{item.label}</span>
              </Link>
            );
          })}
          {comingSoonItems.map((item) => (
            <span aria-disabled="true" className="flex h-12 w-12 cursor-not-allowed items-center rounded-lg px-[14px] text-[var(--muted-foreground)] transition-[width,background-color,color] duration-300 ease-out group-hover:w-full group-hover:bg-[var(--surface-low)] group-hover:text-[var(--foreground)] group-focus-within:w-full" key={item.label} title={`${item.label}: próximamente`}>
              <AppIcon name={item.icon} />
              <span className="ml-4 whitespace-nowrap text-sm opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">{item.label}</span>
            </span>
          ))}
        </nav>
      </aside>
      <div className="pb-[84px] md:ml-20 md:pb-0">{children}</div>
      <nav aria-label="Navegación principal" className="fixed inset-x-0 bottom-0 z-20 flex h-[76px] items-center justify-around border-t border-[var(--border)] bg-[var(--surface-lowest)] px-3 pb-[env(safe-area-inset-bottom)] md:hidden">
        {navigationItems.map((item) => {
          const selected = item.id === active;
          return (
            <Link aria-current={selected ? 'page' : undefined} className={`flex min-h-11 min-w-16 flex-col items-center justify-center gap-1 rounded-lg px-2 text-xs ${selected ? 'bg-[var(--nav-active)] font-medium text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`} href={item.href} key={item.id} onClick={(event) => void navigate(event, item.href, selected)}>
              <AppIcon name={item.icon} />
              {item.id === 'new' ? 'Añadir' : item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
