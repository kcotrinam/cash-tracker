'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { authenticatedFetch, getApiUrl } from '../authenticated-fetch';
import { AppShell } from '../components/app-shell';
import { formatMoney, toCents } from './money';
import type { CurrencyCode, DashboardData } from './dashboard.types';

type ViewState = 'loading' | 'populated' | 'empty' | 'error';
const api = getApiUrl();
const currentMonth = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' }).slice(0, 7);
const months = Array.from({ length: 12 }, (_, index) => {
  const date = new Date(`${currentMonth}-01T12:00:00`);
  date.setMonth(date.getMonth() - index);
  return date.toLocaleDateString('en-CA').slice(0, 7);
});
const statusLabel = {
  PENDING: 'Pendiente',
  RECORDED: 'Registrado',
  INACTIVE: 'Inactivo',
} as const;

function validCurrency(value: string | null): value is CurrencyCode {
  return value === 'PEN' || value === 'USD';
}
function validMonth(value: string | null): value is string {
  return Boolean(value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value));
}
function dateLabel(value: string) {
  return new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short' })
    .format(new Date(`${value}T12:00:00`))
    .replace('.', '');
}
function monthLabel(value: string) {
  return new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' })
    .format(new Date(`${value}-01T12:00:00`))
    .replace(/^./, (letter) => letter.toUpperCase());
}

function Icon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    dashboard: 'M4 4h6v6H4V4Zm10 0h6v10h-6V4ZM4 14h6v6H4v-6Zm10 4v-4h6v6h-6v-2Z',
    home: 'm3 11 9-7 9 7v9h-6v-6H9v6H3v-9Z',
    briefcase: 'M8 6V4h8v2h4v14H4V6h4Zm2 0h4V5h-4v1Zm8 5H6v7h12v-7Z',
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
    spark: 'm12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2Z',
    menu: 'M4 7h16M4 12h16M4 17h16',
    repeat: 'M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3m13-3v2a4 4 0 0 1-4 4H4',
  };
  return (
    <svg
      aria-hidden="true"
      className="size-5 shrink-0 fill-none stroke-current"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      <path d={paths[name] ?? paths.dots} />
    </svg>
  );
}
function Summary({ data }: { data: DashboardData }) {
  return (
    <section
      aria-labelledby="summary-heading"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.55fr_1fr_1fr]"
    >
      <h2 id="summary-heading" className="sr-only">
        Resumen mensual
      </h2>
      <article className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:col-span-2 lg:col-span-1">
        <p className="text-sm font-medium text-[var(--muted-foreground)]">
          Saldo del mes
        </p>
        <p className="mt-4 font-[family-name:var(--font-geist)] text-4xl font-semibold tracking-[-0.035em] tabular-nums sm:text-5xl">
          {formatMoney(data.summary.netBalance, data.currency)}
        </p>
      </article>
      <article className="rounded-xl border border-[var(--border)] bg-[var(--surface-low)] p-5">
        <p className="text-sm font-medium text-[var(--muted-foreground)]">Ingresos</p>
        <p className="mt-5 text-2xl font-medium tabular-nums text-[var(--income)]">
          {formatMoney(data.summary.income, data.currency, true)}
        </p>
      </article>
      <article className="rounded-xl border border-[var(--border)] bg-[var(--surface-low)] p-5">
        <p className="text-sm font-medium text-[var(--muted-foreground)]">Gastos</p>
        <p className="mt-5 text-2xl font-medium tabular-nums text-[var(--expense)]">
          {formatMoney(data.summary.expenses, data.currency, true).replace('+', '−')}
        </p>
      </article>
    </section>
  );
}
function Spending({ data }: { data: DashboardData }) {
  const items = [...data.spendingByCategory].sort((a, b) =>
    toCents(a.amount) === toCents(b.amount)
      ? 0
      : toCents(a.amount) > toCents(b.amount)
        ? -1
        : 1,
  );
  return (
    <section
      aria-labelledby="spending-heading"
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6"
    >
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <h2 id="spending-heading" className="text-lg font-medium tracking-[-0.02em]">
          Distribución de gastos
        </h2>
        <span className="text-sm text-[var(--muted-foreground)]">
          {formatMoney(data.summary.expenses, data.currency)}
        </span>
      </div>
      <p className="sr-only">
        Gastos por categoría:{' '}
        {items
          .map(
            (item) =>
              `${item.categoryName}, ${formatMoney(item.amount, data.currency)}, ${item.percentage} por ciento`,
          )
          .join('; ')}
        .
      </p>
      <ul className="space-y-5">
        {items.map((item) => (
          <li key={item.categoryId}>
            <div className="mb-2 flex justify-between gap-4 text-sm">
              <span>{item.categoryName}</span>
              <span className="shrink-0 tabular-nums text-[var(--muted-foreground)]">
                {formatMoney(item.amount, data.currency)} · {item.percentage}%
              </span>
            </div>
            <div
              aria-hidden="true"
              className="h-2 overflow-hidden rounded-full bg-[var(--bar-track)]"
            >
              <div
                className="h-full rounded-full"
                style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
function Recurring({ data }: { data: DashboardData }) {
  return (
    <section
      aria-labelledby="recurring-heading"
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6"
    >
      <h2 id="recurring-heading" className="text-lg font-medium tracking-[-0.02em]">
        Recurrentes del mes
      </h2>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        No se incluyen en los totales hasta registrarse.
      </p>
      <ul className="mt-5 divide-y divide-[var(--border)]">
        {data.recurringItems.map((item) => (
          <li className="py-4 first:pt-0 last:pb-0" key={item.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Programado: {dateLabel(item.scheduledOn)} ·{' '}
                  {item.recordedTransactionId
                    ? 'Movimiento registrado'
                    : 'Sin movimiento registrado'}
                </p>
              </div>
              <p
                className={`shrink-0 text-sm font-medium tabular-nums ${item.type === 'INCOME' ? 'text-[var(--income)]' : 'text-[var(--foreground)]'}`}
              >
                {formatMoney(item.amount, data.currency, item.type === 'INCOME')}
              </p>
            </div>
            <span className="mt-2 inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-low)] px-2.5 py-1 text-xs font-medium text-[var(--muted-foreground)]">
              {statusLabel[item.periodStatus]}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
function Transactions({ data }: { data: DashboardData }) {
  return (
    <section
      aria-labelledby="transactions-heading"
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)]"
    >
      <div className="flex items-center justify-between p-5 sm:p-6">
        <h2 id="transactions-heading" className="text-lg font-medium tracking-[-0.02em]">
          Movimientos recientes
        </h2>
        <span className="text-sm text-[var(--muted-foreground)]">
          {data.recentTransactions.length} movimientos
        </span>
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left">
          <thead className="border-y border-[var(--border)] text-sm text-[var(--muted-foreground)]">
            <tr>
              <th className="px-6 py-3 font-medium">Fecha</th>
              <th className="px-6 py-3 font-medium">Descripción</th>
              <th className="px-6 py-3 font-medium">Categoría</th>
              <th className="px-6 py-3 text-right font-medium">Importe</th>
            </tr>
          </thead>
          <tbody>
            {data.recentTransactions.map((item) => (
              <tr className="border-b border-[var(--border)] last:border-0" key={item.id}>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--muted-foreground)]">
                  {dateLabel(item.occurredOn)}
                </td>
                <td className="px-6 py-4 font-medium">{item.description}</td>
                <td className="px-6 py-4">
                  <span className="rounded-md bg-[var(--surface-low)] px-2 py-1 text-sm text-[var(--muted-foreground)]">
                    {item.category.name}
                  </span>
                </td>
                <td
                  className={`px-6 py-4 text-right font-medium tabular-nums ${item.type === 'INCOME' ? 'text-[var(--income)]' : 'text-[var(--expense)]'}`}
                >
                  {formatMoney(item.amount, data.currency, item.type === 'INCOME')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-[var(--border)] md:hidden">
        {data.recentTransactions.slice(0, 5).map((item) => (
          <li className="flex items-center justify-between gap-3 p-4" key={item.id}>
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-low)] text-[var(--muted-foreground)]">
                <Icon name={item.category.icon ?? 'dots'} />
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium">{item.description}</p>
                <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
                  {dateLabel(item.occurredOn)} · {item.category.name}
                </p>
              </div>
            </div>
            <p
              className={`shrink-0 font-medium tabular-nums ${item.type === 'INCOME' ? 'text-[var(--income)]' : 'text-[var(--expense)]'}`}
            >
              {formatMoney(item.amount, data.currency, item.type === 'INCOME')}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="animate-pulse space-y-6">
      <p className="sr-only">Cargando resumen financiero.</p>
      <div className="h-40 rounded-xl bg-[var(--surface)]" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-80 rounded-xl bg-[var(--surface)] lg:col-span-2" />
        <div className="h-80 rounded-xl bg-[var(--surface)]" />
      </div>
      <div className="h-72 rounded-xl bg-[var(--surface)]" />
    </div>
  );
}
function Notice({ kind, onRetry }: { kind: 'empty' | 'error'; onRetry: () => void }) {
  const error = kind === 'error';
  return (
    <section
      aria-live="polite"
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-6 py-16 text-center"
    >
      <h2 className="text-xl font-medium">
        {error
          ? 'No pudimos cargar tu resumen financiero.'
          : 'Información no proporcionada aún.'}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
        {error
          ? 'Revisa tu conexión e inténtalo nuevamente.'
          : 'Cuando registres movimientos, aquí verás el resumen de este período.'}
      </p>
      {error && (
        <button
          className="mt-6 min-h-11 rounded-lg bg-[var(--primary)] px-4 text-sm font-medium text-[var(--primary-foreground)]"
          onClick={onRetry}
          type="button"
        >
          Reintentar
        </button>
      )}
    </section>
  );
}

export function DashboardClient() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const monthParam = params.get('month');
  const currencyParam = params.get('currency');
  const month = validMonth(monthParam) ? monthParam : currentMonth;
  const currency: CurrencyCode = validCurrency(currencyParam) ? currencyParam : 'PEN';
  const fixture = process.env.NODE_ENV !== 'production' ? params.get('state') : null;
  const [state, setState] = useState<ViewState>(() =>
    fixture === 'loading' ? 'loading' : fixture === 'error' ? 'error' : 'loading',
  );
  const [data, setData] = useState<DashboardData | null>(null);
  const [retry, setRetry] = useState(0);
  const request = useMemo(() => ({ month, currency }), [month, currency]);
  useEffect(() => {
    let active = true;
    if (fixture === 'loading' || (fixture === 'error' && retry === 0))
      return () => {
        active = false;
      };
    void authenticatedFetch(
      `${api}/dashboard?month=${encodeURIComponent(request.month)}&currency=${request.currency}`,
    )
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json() as Promise<DashboardData>;
      })
      .then((result) => {
        if (!active) return;
        setData(result);
        setState(fixture === 'empty' || result.recentTransactions.length === 0 ? 'empty' : 'populated');
      })
      .catch(() => active && setState('error'));
    return () => {
      active = false;
    };
  }, [fixture, request, retry]);
  function update(key: 'month' | 'currency', value: string) {
    const next = new URLSearchParams(params.toString());
    next.set(key, value);
    next.delete('state');
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }
  return (
    <AppShell active="dashboard" screenClassName="dashboard-screen">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-sm">
        <div className="mx-auto flex min-h-16 max-w-[1200px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <span className="md:hidden">
              <Icon name="menu" />
            </span>
            <h1 className="text-xl font-semibold tracking-[-0.03em] sm:text-2xl">
              CashTracker
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="dashboard-month">
              Mes
            </label>
            <select
              className="h-11 max-w-40 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)]"
              id="dashboard-month"
              onChange={(event) => update('month', event.target.value)}
              value={month}
            >
              {months.map((item) => (
                <option key={item} value={item}>
                  {monthLabel(item)}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="dashboard-currency">
              Moneda
            </label>
            <select
              className="h-11 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-medium text-[var(--foreground)]"
              id="dashboard-currency"
              onChange={(event) => update('currency', event.target.value)}
              value={currency}
            >
              <option value="PEN">PEN</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        <p className="mb-6 text-sm text-[var(--muted-foreground)]">
          {monthLabel(month)} · {currency}
        </p>
        {state === 'loading' ? (
          <Loading />
        ) : state === 'error' ? (
          <Notice
            kind="error"
            onRetry={() => {
              setState('loading');
              setRetry((value) => value + 1);
            }}
          />
        ) : state === 'empty' ? (
          <Notice kind="empty" onRetry={() => undefined} />
        ) : (
          data && (
            <div className="space-y-6">
              <Summary data={data} />
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <Spending data={data} />
                </div>
                <Recurring data={data} />
              </div>
              <Transactions data={data} />
            </div>
          )
        )}
      </main>
    </AppShell>
  );
}
