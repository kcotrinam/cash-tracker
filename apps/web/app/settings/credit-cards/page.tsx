'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '../../components/app-shell';
import { authenticatedFetch, getApiUrl } from '../../authenticated-fetch';

type Currency = 'PEN' | 'USD';
type Card = {
  id: string;
  name: string;
  currency: Currency;
  creditLimit: string;
  initialBalance: string;
  closingDay: number;
  paymentDay: number;
  isActive: boolean;
  outstandingBalance: string;
  availableCredit: string;
  currentStatement: {
    id: string;
    dueOn: string;
    remainingBalance: string;
    minimumPayment: string | null;
  } | null;
};
type Detail = Card & {
  payments: { id: string; amount: string; paidOn: string }[];
  statements: {
    id: string;
    dueOn: string;
    statementBalance: string;
    remainingBalance: string;
    minimumPayment: string | null;
  }[];
  transactions: {
    id: string;
    description: string;
    amount: string;
    occurredOn: string;
    category: { name: string };
  }[];
};
const api = getApiUrl();
const input =
  'mt-2 h-12 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 outline-none focus:ring-1 focus:ring-[var(--focus-ring)]';
const format = (value: string, currency: Currency) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(Number(value));

export default function CreditCardsPage() {
  const [cards, setCards] = useState<Card[] | null>(null);
  const [selected, setSelected] = useState<Detail | null>(null);
  const [form, setForm] = useState({
    name: '',
    currency: 'PEN' as Currency,
    creditLimit: '',
    initialBalance: '0',
    closingDay: '15',
    paymentDay: '25',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const load = () =>
    authenticatedFetch(`${api}/credit-cards`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setCards)
      .catch(() => setError('No pudimos cargar tus tarjetas.'));
  useEffect(() => {
    void load();
  }, []);
  async function create(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const r = await authenticatedFetch(`${api}/credit-cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          closingDay: Number(form.closingDay),
          paymentDay: Number(form.paymentDay),
        }),
      });
      if (!r.ok) throw new Error('Revisa los datos de la tarjeta.');
      setForm({
        name: '',
        currency: 'PEN',
        creditLimit: '',
        initialBalance: '0',
        closingDay: '15',
        paymentDay: '25',
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos guardar la tarjeta.');
    } finally {
      setSaving(false);
    }
  }
  async function open(id: string) {
    const r = await authenticatedFetch(`${api}/credit-cards/${id}`);
    if (r.ok) setSelected((await r.json()) as Detail);
  }
  async function pay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const r = await authenticatedFetch(`${api}/credit-cards/${selected.id}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: values.get('amount'),
        currency: selected.currency,
        paidOn: values.get('paidOn'),
      }),
    });
    if (!r.ok) return setError('No pudimos registrar el pago.');
    await open(selected.id);
    load();
    form.reset();
  }
  return (
    <AppShell active="settings" screenClassName="settings-screen">
      <main className="mx-auto max-w-6xl px-4 py-7 md:px-8 md:py-10 lg:px-12">
        <Link
          className="inline-flex min-h-11 items-center text-sm text-[var(--muted-foreground)]"
          href="/settings"
        >
          ← Configuración
        </Link>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-.03em]">
              Tarjetas de crédito
            </h1>
            <p className="mt-2 text-[var(--muted-foreground)]">
              Registra compras, conoce tu estado de cuenta y paga a tiempo.
            </p>
          </div>
        </div>
        {error && (
          <p className="mt-5 text-sm text-[var(--destructive)]" role="alert">
            {error}
          </p>
        )}
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section>
            <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
              {cards === null ? (
                <div className="h-32 animate-pulse bg-[var(--surface-raised)]" />
              ) : cards.length === 0 ? (
                <p className="py-10 text-[var(--muted-foreground)]">
                  Aún no tienes tarjetas. Añade una para asociar tus compras y pagos.
                </p>
              ) : (
                cards.map((card) => (
                  <button
                    className="flex min-h-28 w-full items-center justify-between gap-4 py-4 text-left hover:bg-[var(--surface-low)]"
                    key={card.id}
                    onClick={() => void open(card.id)}
                  >
                    <span>
                      <strong className="block">{card.name}</strong>
                      <span className="mt-1 block text-sm text-[var(--muted-foreground)]">
                        Cierra el {card.closingDay} · vence el {card.paymentDay}
                      </span>
                    </span>
                    <span className="text-right">
                      <strong className="block tabular-nums">
                        {format(card.creditLimit, card.currency)}
                      </strong>
                      <span className="mt-1 block text-sm text-[var(--muted-foreground)]">
                        Línea de crédito
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
            {selected && (
              <section className="mt-10 border-t border-[var(--border)] pt-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold">{selected.name}</h2>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      Línea: {format(selected.creditLimit, selected.currency)} · Deuda:{' '}
                      {format(selected.outstandingBalance, selected.currency)} ·
                      Disponible: {format(selected.availableCredit, selected.currency)}
                    </p>
                  </div>
                  <button
                    className="min-h-11 text-sm underline"
                    onClick={() => setSelected(null)}
                  >
                    Cerrar
                  </button>
                </div>
                <div className="mt-7 grid gap-7 md:grid-cols-2">
                  <div>
                    <h3 className="font-medium">Último estado de cuenta</h3>
                    <p className="mt-2 text-2xl font-semibold tabular-nums">
                      {selected.currentStatement
                        ? format(
                            selected.currentStatement.remainingBalance,
                            selected.currency,
                          )
                        : 'Sin estado cerrado'}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      {selected.currentStatement
                        ? `Vence ${selected.currentStatement.dueOn}`
                        : 'Se generará al cerrar el período.'}
                    </p>
                  </div>
                  <form onSubmit={pay}>
                    <label className="text-sm font-medium">
                      Registrar pago
                      <input
                        className={input}
                        inputMode="decimal"
                        name="amount"
                        placeholder="0.00"
                        required
                      />
                    </label>
                    <input
                      className={input}
                      defaultValue={new Date().toLocaleDateString('en-CA')}
                      name="paidOn"
                      required
                      type="date"
                    />
                    <button
                      className="mt-4 min-h-12 rounded-lg bg-[var(--primary)] px-5 font-medium text-[var(--primary-foreground)]"
                      type="submit"
                    >
                      Guardar pago
                    </button>
                  </form>
                </div>
                <h3 className="mt-10 font-medium">Compras recientes</h3>
                <ul className="mt-3 divide-y divide-[var(--border)]">
                  {selected.transactions.map((item) => (
                    <li className="flex justify-between gap-4 py-3" key={item.id}>
                      <span>
                        {item.description}
                        <small className="ml-2 text-[var(--muted-foreground)]">
                          {item.category.name}
                        </small>
                      </span>
                      <strong className="tabular-nums">
                        {format(item.amount, selected.currency)}
                      </strong>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </section>
          <aside className="border-t border-[var(--border)] pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <h2 className="text-xl font-semibold">Añadir tarjeta</h2>
            <form className="mt-6 space-y-5" noValidate onSubmit={create}>
              <label className="block text-sm font-medium">
                Nombre
                <input
                  className={input}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  value={form.name}
                />
              </label>
              <label className="block text-sm font-medium">
                Moneda
                <select
                  className={input}
                  onChange={(e) =>
                    setForm({ ...form, currency: e.target.value as Currency })
                  }
                  value={form.currency}
                >
                  <option>PEN</option>
                  <option>USD</option>
                </select>
              </label>
              <label className="block text-sm font-medium">
                Línea de crédito
                <input
                  className={input}
                  inputMode="decimal"
                  onChange={(e) => setForm({ ...form, creditLimit: e.target.value })}
                  required
                  value={form.creditLimit}
                />
              </label>
              <label className="block text-sm font-medium">
                Saldo inicial
                <input
                  className={input}
                  inputMode="decimal"
                  onChange={(e) => setForm({ ...form, initialBalance: e.target.value })}
                  value={form.initialBalance}
                />
                <span className="mt-1 block text-xs font-normal text-[var(--muted-foreground)]">
                  Deuda existente antes de usar CashTracker.
                </span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-medium">
                  Cierre
                  <input
                    className={input}
                    max="31"
                    min="1"
                    onChange={(e) => setForm({ ...form, closingDay: e.target.value })}
                    type="number"
                    value={form.closingDay}
                  />
                </label>
                <label className="text-sm font-medium">
                  Pago
                  <input
                    className={input}
                    max="31"
                    min="1"
                    onChange={(e) => setForm({ ...form, paymentDay: e.target.value })}
                    type="number"
                    value={form.paymentDay}
                  />
                </label>
              </div>
              <button
                className="min-h-12 w-full rounded-lg bg-[var(--primary)] px-5 font-medium text-[var(--primary-foreground)] disabled:opacity-60"
                disabled={saving}
                type="submit"
              >
                {saving ? 'Guardando…' : 'Guardar tarjeta'}
              </button>
            </form>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}
