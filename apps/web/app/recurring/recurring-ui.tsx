'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useId, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { authenticatedFetch } from '../authenticated-fetch';
import { AppShell } from '../components/app-shell';

const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
type Type = 'EXPENSE' | 'INCOME';
type Currency = 'PEN' | 'USD';
type Frequency = 'WEEKLY' | 'MONTHLY' | 'YEARLY';
type Status = 'ACTIVE' | 'PAUSED' | 'FINISHED';
type Category = { id: string; name: string; type: Type; isActive: boolean };
type Item = {
  id: string;
  type: Type;
  description: string;
  amount: string;
  currency: Currency;
  frequency: Frequency;
  interval: number;
  startDate: string;
  endDate: string | null;
  nextOccurrenceDate: string;
  status: Status;
  category: Category;
};
const input =
  'mt-2 h-12 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-base outline-none focus:border-[var(--focus-ring)] focus:ring-1 focus:ring-[var(--focus-ring)]';
const today = (() => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
})();
function money(value: string, currency: Currency) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(Number(value));
}
function frequency(item: Pick<Item, 'frequency' | 'interval' | 'startDate'>) {
  const base =
    item.frequency === 'WEEKLY' ? 'semana' : item.frequency === 'MONTHLY' ? 'mes' : 'año';
  return `${item.interval === 1 ? 'Cada' : `Cada ${item.interval}`} ${item.interval === 1 ? base : `${base}${base === 'mes' ? 'es' : 's'}`}`;
}
function statusLabel(status: Status) {
  return status === 'ACTIVE' ? 'Activa' : status === 'PAUSED' ? 'Pausada' : 'Finalizada';
}

function CategoryPicker({
  categories,
  query,
  selectedId,
  onQueryChange,
  onSelect,
  onCreate,
  creating,
}: {
  categories: Category[];
  query: string;
  selectedId: string;
  onQueryChange: (v: string) => void;
  onSelect: (c: Category) => void;
  onCreate: () => void;
  creating: boolean;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const selected = categories.find((c) => c.id === selectedId);
  return (
    <div
      className="relative mt-2"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <input
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={open}
        className="h-12 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-base outline-none focus:border-[var(--focus-ring)] focus:ring-1 focus:ring-[var(--focus-ring)]"
        id="recurring-category"
        onChange={(e) => onQueryChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="Buscar o crear categoría…"
        role="combobox"
        value={selected && !query ? selected.name : query}
      />
      {open && (
        <div
          className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface-lowest)] p-1 shadow-lg"
          id={listId}
          role="listbox"
        >
          {categories.map((category) => (
            <button
              aria-selected={category.id === selectedId}
              className="flex min-h-11 w-full items-center rounded-md px-3 text-left text-sm hover:bg-[var(--surface-raised)] aria-selected:bg-[var(--surface-raised)]"
              key={category.id}
              onClick={() => {
                onSelect(category);
                setOpen(false);
              }}
              role="option"
              type="button"
            >
              {category.name}
            </button>
          ))}
          {!categories.length && (
            <p className="px-3 py-3 text-sm text-[var(--muted-foreground)]">
              No encontramos categorías.
            </p>
          )}
          {query.trim() && (
            <button
              className="mt-1 flex min-h-11 w-full items-center rounded-md border-t border-[var(--border)] px-3 text-left text-sm font-medium hover:bg-[var(--surface-raised)] disabled:opacity-60"
              disabled={creating}
              onClick={() => {
                onCreate();
                setOpen(false);
              }}
              type="button"
            >
              {creating ? 'Creando categoría…' : `Crear “${query.trim()}”`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function NewRecurring() {
  const router = useRouter();
  const [type, setType] = useState<Type>('EXPENSE');
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    description: '',
    categoryId: '',
    amount: '',
    currency: 'PEN' as Currency,
    frequency: 'MONTHLY' as Frequency,
    interval: '1',
    startDate: today,
    endDate: '',
    note: '',
    createFirstOccurrenceNow: false,
  });
  useEffect(() => {
    const controller = new AbortController();
    authenticatedFetch(
      `${api}/categories?type=${type}${query.trim() ? `&search=${encodeURIComponent(query)}` : ''}`,
      { signal: controller.signal },
    )
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((v) => setCategories(Array.isArray(v) ? v : []))
      .catch(() => setCategories([]));
    return () => controller.abort();
  }, [type, query]);
  const change = (key: keyof typeof form, value: string | boolean) => {
    setForm((v) => ({ ...v, [key]: value }));
    setError('');
  };
  async function createCategory() {
    if (!query.trim()) return;
    setCreatingCategory(true);
    try {
      const r = await authenticatedFetch(`${api}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: query.trim(), type }),
      });
      const c = await r.json();
      if (!r.ok) throw new Error();
      setCategories((v) => [c, ...v]);
      change('categoryId', c.id);
      setQuery('');
    } catch {
      setError('No pudimos crear la categoría. Revisa que el nombre no esté repetido.');
    } finally {
      setCreatingCategory(false);
    }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (
      !form.description.trim() ||
      !form.categoryId ||
      !/^\d+(?:[.,]\d+)?$/.test(form.amount) ||
      Number(form.amount.replace(',', '.')) <= 0 ||
      Number(form.interval) < 1
    )
      return setError('Completa los campos obligatorios con valores válidos.');
    if (form.endDate && form.endDate < form.startDate)
      return setError(
        'La fecha de finalización no puede ser anterior a la fecha de inicio.',
      );
    setSaving(true);
    try {
      const r = await authenticatedFetch(`${api}/recurring-transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          type,
          interval: Number(form.interval),
          endDate: form.endDate || undefined,
          note: form.note || undefined,
        }),
      });
      if (!r.ok) throw new Error();
      sessionStorage.setItem(
        'cashtracker-recurring-success',
        form.createFirstOccurrenceNow ? 'first' : 'created',
      );
      router.push('/recurring');
    } catch {
      setError('No pudimos crear la recurrencia. Inténtalo nuevamente.');
      setSaving(false);
    }
  }
  const future = form.startDate > today;
  return (
    <AppShell active="recurring" screenClassName="recurring-screen">
      <main className="mx-auto max-w-3xl px-4 py-6 md:px-10 md:py-12">
        <Link
          className="mb-8 inline-flex min-h-11 items-center text-sm text-[var(--muted-foreground)]"
          href="/recurring"
        >
          ← Recurrentes
        </Link>
        <h1 className="text-[32px] font-semibold tracking-[-.03em] md:text-5xl">
          Nueva recurrencia
        </h1>
        <p className="mt-3 text-[var(--muted-foreground)]">
          Programa un ingreso o gasto que se repite.
        </p>
        <form className="mt-9 space-y-7" noValidate onSubmit={submit}>
          <fieldset className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1">
            <legend className="sr-only">Tipo de movimiento</legend>
            <div className="grid grid-cols-2">
              <button
                className={`min-h-12 rounded-lg ${type === 'EXPENSE' ? 'bg-[var(--surface-raised)] font-medium' : ''}`}
                onClick={() => {
                  setType('EXPENSE');
                  setQuery('');
                  change('categoryId', '');
                }}
                type="button"
              >
                Gasto
              </button>
              <button
                className={`min-h-12 rounded-lg ${type === 'INCOME' ? 'bg-[var(--surface-raised)] font-medium' : ''}`}
                onClick={() => {
                  setType('INCOME');
                  setQuery('');
                  change('categoryId', '');
                }}
                type="button"
              >
                Ingreso
              </button>
            </div>
          </fieldset>
          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 md:p-7">
            <h2 className="text-xl font-medium">Detalles</h2>
            <div className="mt-5 space-y-5">
              <label className="block text-sm font-medium">
                Descripción
                <input
                  className={input}
                  onChange={(e) => change('description', e.target.value)}
                  placeholder="Ej. Alquiler mensual"
                  value={form.description}
                />
              </label>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="text-sm font-medium">
                  <label htmlFor="recurring-category">Categoría</label>
                  <CategoryPicker
                    categories={categories}
                    creating={creatingCategory}
                    onCreate={createCategory}
                    onQueryChange={(v) => {
                      setQuery(v);
                      change('categoryId', '');
                    }}
                    onSelect={(c) => {
                      change('categoryId', c.id);
                      setQuery('');
                    }}
                    query={query}
                    selectedId={form.categoryId}
                  />
                </div>
                <label className="block text-sm font-medium">
                  Monto
                  <div className="relative">
                    <input
                      className={`${input} pr-20 text-xl tabular-nums`}
                      inputMode="decimal"
                      onChange={(e) =>
                        change('amount', e.target.value.replace(/[^0-9,.]/g, ''))
                      }
                      placeholder="0.00"
                      value={form.amount}
                    />
                    <select
                      aria-label="Moneda"
                      className="absolute right-2 top-5 bg-transparent text-sm"
                      onChange={(e) => change('currency', e.target.value)}
                      value={form.currency}
                    >
                      <option>PEN</option>
                      <option>USD</option>
                    </select>
                  </div>
                </label>
              </div>
            </div>
          </section>
          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 md:p-7">
            <h2 className="text-xl font-medium">Programación</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Frecuencia
                <select
                  className={input}
                  onChange={(e) => change('frequency', e.target.value)}
                  value={form.frequency}
                >
                  <option value="WEEKLY">Semanal</option>
                  <option value="MONTHLY">Mensual</option>
                  <option value="YEARLY">Anual</option>
                </select>
              </label>
              <label className="block text-sm font-medium">
                Repetir cada
                <input
                  className={input}
                  min="1"
                  onChange={(e) => change('interval', e.target.value)}
                  type="number"
                  value={form.interval}
                />
                <span className="mt-1 block text-xs font-normal text-[var(--muted-foreground)]">
                  Cada {form.interval || '1'}{' '}
                  {form.frequency === 'WEEKLY'
                    ? 'semana(s)'
                    : form.frequency === 'MONTHLY'
                      ? 'mes(es)'
                      : 'año(s)'}
                </span>
              </label>
              <label className="block text-sm font-medium">
                Fecha de inicio
                <input
                  className={input}
                  onChange={(e) => change('startDate', e.target.value)}
                  type="date"
                  value={form.startDate}
                />
              </label>
              <label className="block text-sm font-medium">
                Fecha de finalización{' '}
                <span className="font-normal text-[var(--muted-foreground)]">
                  (opcional)
                </span>
                <input
                  className={input}
                  min={form.startDate}
                  onChange={(e) => change('endDate', e.target.value)}
                  type="date"
                  value={form.endDate}
                />
              </label>
            </div>
          </section>
          <label className="block text-sm font-medium">
            Nota{' '}
            <span className="font-normal text-[var(--muted-foreground)]">(opcional)</span>
            <textarea
              className={`${input} h-28 py-3`}
              onChange={(e) => change('note', e.target.value)}
              value={form.note}
            />
          </label>
          <label className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <input
              aria-describedby="first-occurrence-help"
              checked={form.createFirstOccurrenceNow}
              className="mt-1 size-5"
              disabled={future}
              onChange={(e) => change('createFirstOccurrenceNow', e.target.checked)}
              type="checkbox"
            />
            <span>
              <span className="font-medium">Registrar la primera ocurrencia ahora</span>
              <span
                className="mt-1 block text-sm text-[var(--muted-foreground)]"
                id="first-occurrence-help"
              >
                {future
                  ? 'Disponible cuando la fecha de inicio sea hoy o anterior.'
                  : 'Se creará un movimiento real con la fecha de inicio.'}
              </span>
            </span>
          </label>
          {error && (
            <p
              aria-live="assertive"
              className="rounded-lg bg-[var(--destructive)] px-4 py-3 text-sm text-[var(--destructive-foreground)]"
              role="alert"
            >
              {error}
            </p>
          )}
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <Link
              className="flex min-h-12 items-center justify-center rounded-lg border border-[var(--border)] px-5 font-medium"
              href="/recurring"
            >
              Cancelar
            </Link>
            <button
              aria-busy={saving}
              className="min-h-12 rounded-lg bg-[var(--primary)] px-5 font-medium text-[var(--primary-foreground)] disabled:opacity-60"
              disabled={saving}
              type="submit"
            >
              {saving ? 'Creando…' : 'Crear recurrencia'}
            </button>
          </div>
        </form>
      </main>
    </AppShell>
  );
}

export function RecurringList() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [data, setData] = useState<{
    items: Item[];
    pagination: { page: number; totalPages: number; total: number };
  } | null>(null);
  const [error, setError] = useState(false);
  const [notice, setNotice] = useState('');
  const [confirming, setConfirming] = useState<{ item: Item; status: Status } | null>(
    null,
  );
  const query = params.toString();
  const set = (key: string, value: string) => {
    const p = new URLSearchParams(params);
    if (value) p.set(key, value);
    else p.delete(key);
    if (key !== 'page') p.delete('page');
    router.replace(`${pathname}${p.size ? `?${p}` : ''}`);
  };
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await authenticatedFetch(
          `${api}/recurring-transactions?${query}`,
        );
        if (!response.ok) throw new Error();
        const payload = await response.json();
        if (!active) return;
        const saved = sessionStorage.getItem('cashtracker-recurring-success');
        if (saved) {
          sessionStorage.removeItem('cashtracker-recurring-success');
          setNotice(
            saved === 'first'
              ? 'Recurrencia y primer movimiento creados correctamente.'
              : 'Recurrencia creada correctamente.',
          );
        }
        setError(false);
        setData(payload);
      } catch {
        if (active) setError(true);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [query]);
  async function changeStatus() {
    if (!confirming) return;
    try {
      const r = await authenticatedFetch(
        `${api}/recurring-transactions/${confirming.item.id}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: confirming.status }),
        },
      );
      if (!r.ok) throw new Error();
      setNotice(
        `Recurrencia ${statusLabel(confirming.status).toLowerCase()} correctamente.`,
      );
      setConfirming(null);
      router.refresh();
      setData((current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) =>
                item.id === confirming.item.id
                  ? { ...item, status: confirming.status }
                  : item,
              ),
            }
          : current,
      );
    } catch {
      setNotice('No pudimos actualizar la recurrencia.');
      setConfirming(null);
    }
  }
  const filtered = params.has('search') || params.has('status');
  return (
    <AppShell active="recurring" screenClassName="recurring-screen">
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-10 md:py-12">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="text-[32px] font-semibold tracking-[-.03em] md:text-5xl">
              Recurrentes
            </h1>
            <p className="mt-3 text-[var(--muted-foreground)]">
              Administra los ingresos y gastos que se repiten.
            </p>
          </div>
          <Link
            className="flex min-h-12 items-center rounded-lg bg-[var(--primary)] px-5 font-medium text-[var(--primary-foreground)]"
            href="/recurring/new"
          >
            + <span className="ml-2 sm:hidden">Nueva</span>
            <span className="ml-2 hidden sm:inline">Nueva recurrencia</span>
          </Link>
        </div>
        {notice && (
          <div
            className="mt-7 flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3"
            role="status"
          >
            {notice}
            <button
              aria-label="Cerrar confirmación"
              onClick={() => setNotice('')}
              type="button"
            >
              ×
            </button>
          </div>
        )}
        <section
          aria-label="Filtros"
          className="mt-8 flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 md:flex-row md:items-center md:justify-between"
        >
          <div className="flex overflow-x-auto rounded-lg bg-[var(--background)] p-1">
            {(
              [
                ['', 'Todas'],
                ['ACTIVE', 'Activas'],
                ['PAUSED', 'Pausadas'],
                ['FINISHED', 'Finalizadas'],
              ] as const
            ).map(([value, label]) => (
              <button
                className={`min-h-11 whitespace-nowrap rounded-md px-4 text-sm ${params.get('status') === value || (!value && !params.get('status')) ? 'bg-[var(--surface-raised)] font-medium' : 'text-[var(--muted-foreground)]'}`}
                key={value}
                onClick={() => set('status', value)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <input
            aria-label="Buscar recurrencias"
            className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 outline-none focus:border-[var(--focus-ring)] md:w-64"
            defaultValue={params.get('search') ?? ''}
            onChange={(e) => set('search', e.target.value)}
            placeholder="Buscar recurrencias"
          />
        </section>
        {error ? (
          <div className="mt-10 rounded-xl border border-[var(--border)] p-8">
            <h2 className="text-xl font-medium">No pudimos cargar tus recurrencias.</h2>
            <button
              className="mt-4 min-h-11 underline"
              onClick={() => router.refresh()}
              type="button"
            >
              Reintentar
            </button>
          </div>
        ) : !data ? (
          <div
            aria-live="polite"
            className="mt-10 h-56 animate-pulse rounded-xl bg-[var(--surface-raised)]"
          >
            <span className="sr-only">Cargando recurrencias</span>
          </div>
        ) : data.items.length === 0 ? (
          <div className="mt-10 rounded-xl border border-[var(--border)] p-10 text-center">
            <h2 className="text-xl font-medium">
              {filtered ? 'No encontramos recurrencias.' : 'Aún no tienes recurrencias.'}
            </h2>
            <p className="mt-2 text-[var(--muted-foreground)]">
              {filtered
                ? 'Prueba cambiando o limpiando los filtros.'
                : 'Crea una regla para organizar tus ingresos y gastos que se repiten.'}
            </p>
            {!filtered && (
              <Link
                className="mt-5 inline-flex min-h-12 items-center rounded-lg bg-[var(--primary)] px-5 font-medium text-[var(--primary-foreground)]"
                href="/recurring/new"
              >
                Crear recurrencia
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="mt-8 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
              <table className="hidden w-full text-left md:table">
                <thead className="bg-[var(--background)] text-sm text-[var(--muted-foreground)]">
                  <tr>
                    <th className="p-4">Recurrente</th>
                    <th>Categoría</th>
                    <th>Frecuencia</th>
                    <th>Próxima fecha</th>
                    <th>Estado</th>
                    <th className="text-right">Monto</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr className="border-t border-[var(--border)]" key={item.id}>
                      <td className="p-4 font-medium">{item.description}</td>
                      <td>
                        <span className="rounded border border-[var(--border)] px-2 py-1 text-sm text-[var(--muted-foreground)]">
                          {item.category.name}
                        </span>
                      </td>
                      <td className="text-[var(--muted-foreground)]">
                        {frequency(item)}
                      </td>
                      <td className="text-[var(--muted-foreground)]">
                        {item.nextOccurrenceDate}
                      </td>
                      <td>
                        <span>{statusLabel(item.status)}</span>
                      </td>
                      <td
                        className={`text-right font-medium tabular-nums ${item.type === 'INCOME' ? 'text-[#a9c6ad]' : 'text-[#e3aaa2]'}`}
                      >
                        {item.type === 'INCOME' ? '+' : '−'}
                        {money(item.amount, item.currency)}
                      </td>
                      <td className="p-4 text-right">
                        <select
                          aria-label={`Acciones para ${item.description}`}
                          className="min-h-11 rounded border bg-transparent px-2 text-sm"
                          defaultValue=""
                          onChange={(e) => {
                            const value = e.target.value as Status;
                            if (value) setConfirming({ item, status: value });
                            e.currentTarget.value = '';
                          }}
                        >
                          <option value="">Acciones</option>
                          {item.status === 'ACTIVE' && (
                            <option value="PAUSED">Pausar</option>
                          )}
                          {item.status === 'PAUSED' && (
                            <option value="ACTIVE">Reactivar</option>
                          )}
                          {item.status !== 'FINISHED' && (
                            <option value="FINISHED">Finalizar</option>
                          )}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ul className="divide-y divide-[var(--border)] md:hidden">
                {data.items.map((item) => (
                  <li className="p-4" key={item.id}>
                    <div className="flex justify-between gap-3">
                      <div>
                        <strong>{item.description}</strong>
                        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                          {item.category.name} · {frequency(item)}
                        </p>
                        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                          Próx: {item.nextOccurrenceDate} · {statusLabel(item.status)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`font-medium tabular-nums ${item.type === 'INCOME' ? 'text-[#a9c6ad]' : 'text-[#e3aaa2]'}`}
                        >
                          {item.type === 'INCOME' ? '+' : '−'}
                          {money(item.amount, item.currency)}
                        </span>
                        <select
                          aria-label={`Acciones para ${item.description}`}
                          className="min-h-11 rounded border bg-transparent px-2 text-sm"
                          defaultValue=""
                          onChange={(e) => {
                            const value = e.target.value as Status;
                            if (value) setConfirming({ item, status: value });
                            e.currentTarget.value = '';
                          }}
                        >
                          <option value="">Acciones</option>
                          {item.status === 'ACTIVE' && (
                            <option value="PAUSED">Pausar</option>
                          )}
                          {item.status === 'PAUSED' && (
                            <option value="ACTIVE">Reactivar</option>
                          )}
                          {item.status !== 'FINISHED' && (
                            <option value="FINISHED">Finalizar</option>
                          )}
                        </select>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <nav aria-label="Paginación" className="mt-5 flex justify-end gap-3">
              <button
                className="min-h-11 rounded border px-4 disabled:opacity-50"
                disabled={data.pagination.page <= 1}
                onClick={() => set('page', String(data.pagination.page - 1))}
                type="button"
              >
                Anterior
              </button>
              <span className="flex items-center">
                Página {data.pagination.page} de {data.pagination.totalPages || 1}
              </span>
              <button
                className="min-h-11 rounded border px-4 disabled:opacity-50"
                disabled={data.pagination.page >= data.pagination.totalPages}
                onClick={() => set('page', String(data.pagination.page + 1))}
                type="button"
              >
                Siguiente
              </button>
            </nav>
          </>
        )}
      </main>
      {confirming && (
        <div
          aria-labelledby="recurring-confirm-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h2 className="text-xl font-medium" id="recurring-confirm-title">
              {confirming.status === 'PAUSED'
                ? '¿Pausar recurrencia?'
                : confirming.status === 'FINISHED'
                  ? '¿Finalizar recurrencia?'
                  : '¿Reactivar recurrencia?'}
            </h2>
            <p className="mt-3 text-[var(--muted-foreground)]">
              {confirming.status === 'PAUSED'
                ? 'No se crearán movimientos mientras esté pausada.'
                : confirming.status === 'FINISHED'
                  ? 'No se crearán más movimientos futuros.'
                  : 'La siguiente ocurrencia se calculará a partir de hoy.'}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="min-h-11 rounded border px-4"
                onClick={() => setConfirming(null)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="min-h-11 rounded bg-[var(--primary)] px-4 font-medium text-[var(--primary-foreground)]"
                onClick={() => void changeStatus()}
                type="button"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
