'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useId, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { authenticatedFetch } from '../authenticated-fetch';
import { getDefaultCurrency } from '../default-currency';
import { AppShell } from '../components/app-shell';

const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
type Type = 'EXPENSE' | 'INCOME';
type Currency = 'PEN' | 'USD';
type Category = {
  id: string;
  name: string;
  type: Type;
  isDefault: boolean;
  isActive: boolean;
};
type Item = {
  id: string;
  type: Type;
  amount: string;
  currencyCode: Currency;
  description: string;
  note?: string | null;
  occurredOn: string;
  category: Category;
};
type EditForm = {
  type: Type;
  amount: string;
  currencyCode: Currency;
  description: string;
  categoryId: string;
  occurredOn: string;
  note: string;
};
const today = new Date().toLocaleDateString('en-CA');
const input =
  'mt-2 h-12 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-base outline-none focus:border-[var(--focus-ring)] focus:ring-1 focus:ring-[var(--focus-ring)]';
function money(value: string, currency: Currency) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(Number(value));
}
async function responseMessage(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => null)) as {
    message?: string | string[];
  } | null;
  return Array.isArray(payload?.message)
    ? payload.message[0]
    : payload?.message || fallback;
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
  onQueryChange: (value: string) => void;
  onSelect: (category: Category) => void;
  onCreate: () => void;
  creating: boolean;
}) {
  const listId = useId();
  const selected = categories.find((category) => category.id === selectedId);
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div
      className="relative mt-2"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false);
      }}
    >
      <input
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={isOpen}
        aria-label="Buscar o seleccionar categoría"
        className="h-12 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-base outline-none focus:border-[var(--focus-ring)] focus:ring-1 focus:ring-[var(--focus-ring)]"
        id="transaction-category"
        onClick={() => setIsOpen(true)}
        onChange={(event) => onQueryChange(event.target.value)}
        onFocus={() => setIsOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setIsOpen(false);
        }}
        placeholder="Buscar o crear categoría…"
        role="combobox"
        value={selected && !query ? selected.name : query}
      />
      {isOpen && (
        <div
          className="absolute z-10 mt-2 max-h-64 w-full overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface-lowest)] p-1 shadow-lg"
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
                setIsOpen(false);
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
              className="mt-1 flex min-h-11 w-full items-center rounded-md border-t border-[var(--border)] px-3 text-left text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-raised)] disabled:opacity-60"
              disabled={creating}
              onClick={() => {
                onCreate();
                setIsOpen(false);
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
export function NewTransaction() {
  const router = useRouter();
  const [type, setType] = useState<Type>('EXPENSE');
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    amount: '',
    currencyCode: 'PEN' as Currency,
    description: '',
    categoryId: '',
    occurredOn: today,
    note: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [categoryQuery, setCategoryQuery] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  useEffect(() => { void getDefaultCurrency().then((currencyCode) => setForm((value) => ({ ...value, currencyCode }))).catch(() => undefined); }, []);
  useEffect(() => {
    const controller = new AbortController();
    const search = categoryQuery.trim()
      ? `&search=${encodeURIComponent(categoryQuery)}`
      : '';
    authenticatedFetch(`${api}/categories?type=${type}${search}`, {
      credentials: 'include',
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((payload) => setCategories(Array.isArray(payload) ? payload : []))
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError')
          return;
        setCategories([]);
        setError('No pudimos cargar las categorías.');
      });
    return () => controller.abort();
  }, [type, categoryQuery]);
  function change(name: keyof typeof form, value: string) {
    setForm((v) => ({ ...v, [name]: value }));
    setError('');
  }
  function changeType(nextType: Type) {
    setType(nextType);
    setCategoryQuery('');
    change('categoryId', '');
  }
  async function createCategory() {
    const name = categoryQuery.trim();
    if (!name) return;
    setCreatingCategory(true);
    try {
      const response = await authenticatedFetch(`${api}/categories`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type }),
      });
      const category = (await response.json().catch(() => null)) as Category | null;
      if (!response.ok || !category) throw new Error();
      setCategories((current) => [
        category,
        ...current.filter((item) => item.id !== category.id),
      ]);
      change('categoryId', category.id);
      setCategoryQuery('');
    } catch {
      setError('No pudimos crear la categoría. Revisa que el nombre no esté repetido.');
    } finally {
      setCreatingCategory(false);
    }
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (
      !/^\d+(?:[.,]\d+)?$/.test(form.amount) ||
      Number(form.amount.replace(',', '.')) <= 0
    )
      return setError('Ingresa un monto válido mayor que cero.');
    if (!form.description.trim()) return setError('Ingresa una descripción.');
    if (!form.categoryId) return setError('Selecciona una categoría.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.occurredOn))
      return setError('Ingresa una fecha válida.');
    setSaving(true);
    try {
      const r = await authenticatedFetch(`${api}/transactions`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, type }),
      });
      if (!r.ok) throw new Error();
      sessionStorage.setItem('cashtracker-transaction-success', '1');
      router.push('/transactions');
    } catch {
      setError('No pudimos guardar el movimiento. Inténtalo nuevamente.');
      setSaving(false);
    }
  }
  return (
    <AppShell active="new" screenClassName="transactions-screen">
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-10 md:py-12">
        <Link
          className="mb-8 inline-flex min-h-11 items-center text-sm text-[var(--muted-foreground)]"
          href="/transactions"
        >
          ← Volver a movimientos
        </Link>
        <div className="max-w-2xl">
          <h1 className="text-[32px] font-semibold tracking-[-.03em] md:text-5xl">
            Añadir movimiento
          </h1>
          <p className="mt-3 text-[var(--muted-foreground)]">
            Registra un ingreso o gasto real.
          </p>
          <form className="mt-10 space-y-7" noValidate onSubmit={submit}>
            <fieldset>
              <legend className="text-sm font-medium">Tipo de movimiento</legend>
              <div className="mt-2 grid grid-cols-2 rounded-lg border border-[var(--border)] p-1">
                <button
                  className={`min-h-11 rounded-md ${type === 'EXPENSE' ? 'bg-[var(--surface-raised)] font-medium' : ''}`}
                  onClick={() => changeType('EXPENSE')}
                  type="button"
                >
                  Gasto
                </button>
                <button
                  className={`min-h-11 rounded-md ${type === 'INCOME' ? 'bg-[var(--surface-raised)] font-medium' : ''}`}
                  onClick={() => changeType('INCOME')}
                  type="button"
                >
                  Ingreso
                </button>
              </div>
            </fieldset>
            <label className="block text-sm font-medium">
              Monto
              <div className="relative">
                <input
                  aria-invalid={Boolean(error && !form.amount)}
                  className={`${input} h-16 pr-20 text-2xl`}
                  inputMode="decimal"
                  onChange={(e) =>
                    change('amount', e.target.value.replace(/[^0-9,.]/g, ''))
                  }
                  placeholder="0.00"
                  value={form.amount}
                />
                <select
                  aria-label="Moneda"
                  className="absolute right-2 top-4 bg-transparent text-sm"
                  onChange={(e) => change('currencyCode', e.target.value)}
                  value={form.currencyCode}
                >
                  <option>PEN</option>
                  <option>USD</option>
                </select>
              </div>
            </label>
            <label className="block text-sm font-medium">
              Descripción
              <input
                className={input}
                onChange={(e) => change('description', e.target.value)}
                placeholder="Ej. Compra de supermercado"
                value={form.description}
              />
            </label>
            <div className="grid gap-7 sm:grid-cols-2">
              <div className="text-sm font-medium">
                <label htmlFor="transaction-category">Categoría</label>
                <CategoryPicker
                  categories={categories}
                  creating={creatingCategory}
                  onCreate={createCategory}
                  onQueryChange={(value) => {
                    setCategoryQuery(value);
                    change('categoryId', '');
                  }}
                  onSelect={(category) => {
                    change('categoryId', category.id);
                    setCategoryQuery('');
                  }}
                  query={categoryQuery}
                  selectedId={form.categoryId}
                />
              </div>
              <label className="block text-sm font-medium">
                Fecha
                <input
                  className={input}
                  onChange={(e) => change('occurredOn', e.target.value)}
                  type="date"
                  value={form.occurredOn}
                />
              </label>
            </div>
            <label className="block text-sm font-medium">
              Nota{' '}
              <span className="font-normal text-[var(--muted-foreground)]">
                (opcional)
              </span>
              <textarea
                className={`${input} h-28 py-3`}
                onChange={(e) => change('note', e.target.value)}
                placeholder="Añade detalles adicionales…"
                value={form.note}
              />
            </label>
            <div
              aria-disabled="true"
              className="rounded-lg border border-dashed border-[var(--border)] p-5"
            >
              <p className="font-medium">
                Comprobante{' '}
                <span className="font-normal text-[var(--muted-foreground)]">
                  Opcional
                </span>
              </p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Disponible próximamente
              </p>
            </div>
            {error && (
              <p
                aria-live="assertive"
                className="rounded-lg bg-[var(--destructive)] px-4 py-3 text-sm text-[var(--destructive-foreground)]"
                role="alert"
              >
                {error}
              </p>
            )}
            <button
              aria-busy={saving}
              className="min-h-12 w-full rounded-lg bg-[var(--primary)] px-5 font-medium text-[var(--primary-foreground)] disabled:opacity-60 sm:w-auto"
              disabled={saving}
              type="submit"
            >
              {saving ? 'Guardando…' : 'Guardar movimiento'}
            </button>
          </form>
        </div>
      </main>
    </AppShell>
  );
}
export function TransactionList() {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const [data, setData] = useState<{
    items: Item[];
    pagination: { page: number; totalPages: number; total: number };
  } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState('');
  const [actionItem, setActionItem] = useState<Item | null>(null);
  const [actionScreen, setActionScreen] = useState<'edit' | 'delete' | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [savingAction, setSavingAction] = useState(false);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const query = params.toString();
  const set = (key: string, value: string) => {
    const p = new URLSearchParams(params);
    if (value) p.set(key, value);
    else p.delete(key);
    if (key !== 'page') p.delete('page');
    router.replace(`${path}${p.size ? `?${p}` : ''}`);
  };
  useEffect(() => {
    if (sessionStorage.getItem('cashtracker-transaction-success')) {
      sessionStorage.removeItem('cashtracker-transaction-success');
      queueMicrotask(() => setSuccess('Movimiento registrado correctamente.'));
    }
    authenticatedFetch(`${api}/categories`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((payload) => setCategories(Array.isArray(payload) ? payload : []))
      .catch(() => setCategories([]));
    authenticatedFetch(`${api}/transactions?${query}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
  }, [query]);
  const filtered = ['search', 'month', 'type', 'categoryId', 'currencyCode'].some((k) =>
    params.has(k),
  );
  function beginAction(item: Item, screen: 'edit' | 'delete') {
    setActionItem(item);
    setActionScreen(screen);
    setOpenMenuId(null);
    setActionError('');
    setEditForm({
      type: item.type,
      amount: item.amount,
      currencyCode: item.currencyCode,
      description: item.description,
      categoryId: item.category.id,
      occurredOn: item.occurredOn,
      note: item.note ?? '',
    });
  }
  function closeActions() {
    setActionItem(null);
    setActionScreen(null);
    setEditForm(null);
    setActionError('');
  }
  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!actionItem || !editForm) return;
    if (
      !/^\d+(?:[.,]\d+)?$/.test(editForm.amount) ||
      Number(editForm.amount.replace(',', '.')) <= 0
    )
      return setActionError('Ingresa un monto válido mayor que cero.');
    if (!editForm.description.trim()) return setActionError('Ingresa una descripción.');
    if (!editForm.categoryId) return setActionError('Selecciona una categoría.');
    setSavingAction(true);
    setActionError('');
    try {
      const response = await authenticatedFetch(`${api}/transactions/${actionItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!response.ok)
        throw new Error(
          await responseMessage(response, 'No pudimos guardar el movimiento.'),
        );
      const updated = (await response.json()) as Item;
      setData(
        (current) =>
          current && {
            ...current,
            items: current.items.map((item) => (item.id === updated.id ? updated : item)),
          },
      );
      closeActions();
      setSuccess('Movimiento actualizado correctamente.');
    } catch (requestError) {
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : 'No pudimos guardar el movimiento.',
      );
    } finally {
      setSavingAction(false);
    }
  }
  async function removeTransaction() {
    if (!actionItem) return;
    setSavingAction(true);
    setActionError('');
    try {
      const response = await authenticatedFetch(`${api}/transactions/${actionItem.id}`, {
        method: 'DELETE',
      });
      if (!response.ok)
        throw new Error(
          await responseMessage(response, 'No pudimos eliminar el movimiento.'),
        );
      setData(
        (current) =>
          current && {
            items: current.items.filter((item) => item.id !== actionItem.id),
            pagination: {
              ...current.pagination,
              total: Math.max(0, current.pagination.total - 1),
            },
          },
      );
      closeActions();
      setSuccess('Movimiento eliminado correctamente.');
    } catch (requestError) {
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : 'No pudimos eliminar el movimiento.',
      );
    } finally {
      setSavingAction(false);
    }
  }
  return (
    <AppShell active="transactions" screenClassName="transactions-screen">
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-10 md:py-12">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="text-[32px] font-semibold tracking-[-.03em] md:text-5xl">
              Movimientos
            </h1>
            <p className="mt-3 text-[var(--muted-foreground)]">
              Todos tus ingresos y gastos registrados.
            </p>
          </div>
          <Link
            className="flex min-h-12 items-center rounded-lg bg-[var(--primary)] px-5 font-medium text-[var(--primary-foreground)]"
            href="/transactions/new"
          >
            + Añadir movimiento
          </Link>
        </div>
        {success && (
          <div
            className="mt-7 flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3"
            role="status"
          >
            {success}
            <button aria-label="Cerrar confirmación" onClick={() => setSuccess('')}>
              ×
            </button>
          </div>
        )}
        <section aria-label="Filtros" className="mt-8 grid gap-3 md:grid-cols-5">
          <input
            aria-label="Buscar movimientos"
            className={input.replace('mt-2 ', '')}
            defaultValue={params.get('search') ?? ''}
            onChange={(e) => set('search', e.target.value)}
            placeholder="Buscar"
          />
          <input
            aria-label="Mes"
            className={input.replace('mt-2 ', '')}
            onChange={(e) => set('month', e.target.value)}
            type="month"
            value={params.get('month') ?? ''}
          />
          <select
            aria-label="Tipo"
            className={input.replace('mt-2 ', '')}
            onChange={(e) => set('type', e.target.value)}
            value={params.get('type') ?? ''}
          >
            <option value="">Todos los tipos</option>
            <option value="EXPENSE">Gastos</option>
            <option value="INCOME">Ingresos</option>
          </select>
          <select
            aria-label="Categoría"
            className={input.replace('mt-2 ', '')}
            onChange={(e) => set('categoryId', e.target.value)}
            value={params.get('categoryId') ?? ''}
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <select
              aria-label="Moneda"
              className={input.replace('mt-2 ', '')}
              onChange={(e) => set('currencyCode', e.target.value)}
              value={params.get('currencyCode') ?? ''}
            >
              <option value="">Todas las monedas</option>
              <option>PEN</option>
              <option>USD</option>
            </select>
            {filtered && (
              <button
                className="min-h-12 text-sm underline"
                onClick={() => router.replace(path)}
              >
                Limpiar
              </button>
            )}
          </div>
        </section>
        {error ? (
          <div className="mt-10 rounded-lg border border-[var(--border)] p-8">
            <h2 className="text-xl font-medium">No pudimos cargar tus movimientos.</h2>
            <button className="mt-4 underline" onClick={() => router.refresh()}>
              Reintentar
            </button>
          </div>
        ) : !data ? (
          <div
            className="mt-10 h-56 animate-pulse rounded-lg bg-[var(--surface-raised)]"
            aria-live="polite"
          >
            {' '}
            <span className="sr-only">Cargando movimientos</span>
          </div>
        ) : data.items.length === 0 ? (
          <div className="mt-10 rounded-lg border border-[var(--border)] p-10 text-center">
            <h2 className="text-xl font-medium">
              {filtered ? 'No encontramos movimientos.' : 'Aún no tienes movimientos.'}
            </h2>
            <p className="mt-2 text-[var(--muted-foreground)]">
              {filtered
                ? 'Prueba cambiando o limpiando los filtros.'
                : 'Registra tu primer ingreso o gasto para comenzar.'}
            </p>
          </div>
        ) : (
          <>
            <div className="mt-8 overflow-hidden rounded-lg border border-[var(--border)]">
              <table className="hidden w-full text-left md:table">
                <thead className="bg-[var(--surface-raised)] text-sm text-[var(--muted-foreground)]">
                  <tr>
                    <th className="p-4">Descripción</th>
                    <th>Categoría</th>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th className="p-4 text-right">Monto</th>
                    <th className="p-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((i) => (
                    <tr className="border-t border-[var(--border)]" key={i.id}>
                      <td className="p-4 font-medium">{i.description}</td>
                      <td>{i.category.name}</td>
                      <td>{i.occurredOn}</td>
                      <td>{i.type === 'INCOME' ? 'Ingreso' : 'Gasto'}</td>
                      <td
                        className={`p-4 text-right font-medium tabular-nums ${i.type === 'INCOME' ? 'text-[#a9c6ad]' : 'text-[#e3aaa2]'}`}
                      >
                        {i.type === 'INCOME' ? '+' : '−'}
                        {money(i.amount, i.currencyCode)}
                      </td>
                      <td className="p-2 text-center">
                        <TransactionActionsMenu
                          item={i}
                          onDelete={() => beginAction(i, 'delete')}
                          onEdit={() => beginAction(i, 'edit')}
                          onOpenChange={(open) => setOpenMenuId(open ? i.id : null)}
                          open={openMenuId === i.id}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ul className="divide-y divide-[var(--border)] md:hidden">
                {data.items.map((i) => (
                  <li className="p-4" key={i.id}>
                    <div className="flex justify-between gap-3">
                      <strong>{i.description}</strong>
                      <div className="flex items-center gap-1">
                        <span
                          className={`tabular-nums ${i.type === 'INCOME' ? 'text-[#a9c6ad]' : 'text-[#e3aaa2]'}`}
                        >
                          {i.type === 'INCOME' ? '+' : '−'}
                          {money(i.amount, i.currencyCode)}
                        </span>
                        <TransactionActionsMenu
                          item={i}
                          onDelete={() => beginAction(i, 'delete')}
                          onEdit={() => beginAction(i, 'edit')}
                          onOpenChange={(open) => setOpenMenuId(open ? i.id : null)}
                          open={openMenuId === i.id}
                        />
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                      {i.category.name} · {i.occurredOn} ·{' '}
                      {i.type === 'INCOME' ? 'Ingreso' : 'Gasto'}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <nav aria-label="Paginación" className="mt-5 flex justify-end gap-3">
              <button
                className="min-h-11 rounded border px-4 disabled:opacity-50"
                disabled={data.pagination.page <= 1}
                onClick={() => set('page', String(data.pagination.page - 1))}
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
              >
                Siguiente
              </button>
            </nav>
          </>
        )}
        {actionItem && editForm && actionScreen && (
          <TransactionActionDialog
            onClose={closeActions}
            title={
              actionScreen === 'edit' ? 'Editar movimiento' : '¿Eliminar movimiento?'
            }
          >
            {actionScreen === 'delete' ? (
              <div>
                <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                  Esta acción eliminará{' '}
                  <strong className="text-[var(--foreground)]">
                    {actionItem.description}
                  </strong>{' '}
                  de forma permanente.
                </p>
                {actionError && (
                  <p className="mt-4 text-sm text-[var(--destructive)]" role="alert">
                    {actionError}
                  </p>
                )}
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    className="min-h-11 rounded-lg border border-[var(--border)] px-4"
                    disabled={savingAction}
                    onClick={closeActions}
                    type="button"
                  >
                    Cancelar
                  </button>
                  <button
                    className="min-h-11 rounded-lg bg-[var(--destructive)] px-4 font-medium text-[var(--destructive-foreground)] disabled:opacity-60"
                    disabled={savingAction}
                    onClick={() => void removeTransaction()}
                    type="button"
                  >
                    {savingAction ? 'Eliminando…' : 'Eliminar'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={saveEdit}>
                <fieldset>
                  <legend className="text-sm font-medium">Tipo</legend>
                  <div className="mt-2 grid grid-cols-2 rounded-lg border border-[var(--border)] p-1">
                    <button
                      className={`min-h-11 rounded-md ${editForm.type === 'EXPENSE' ? 'bg-[var(--surface-raised)] font-medium' : ''}`}
                      onClick={() =>
                        setEditForm({ ...editForm, type: 'EXPENSE', categoryId: '' })
                      }
                      type="button"
                    >
                      Gasto
                    </button>
                    <button
                      className={`min-h-11 rounded-md ${editForm.type === 'INCOME' ? 'bg-[var(--surface-raised)] font-medium' : ''}`}
                      onClick={() =>
                        setEditForm({ ...editForm, type: 'INCOME', categoryId: '' })
                      }
                      type="button"
                    >
                      Ingreso
                    </button>
                  </div>
                </fieldset>
                <label className="mt-5 block text-sm font-medium">
                  Monto
                  <input
                    className={input}
                    inputMode="decimal"
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        amount: event.target.value.replace(/[^0-9,.]/g, ''),
                      })
                    }
                    value={editForm.amount}
                  />
                </label>
                <label className="mt-5 block text-sm font-medium">
                  Moneda
                  <select
                    className={input}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        currencyCode: event.target.value as Currency,
                      })
                    }
                    value={editForm.currencyCode}
                  >
                    <option value="PEN">PEN</option>
                    <option value="USD">USD</option>
                  </select>
                </label>
                <label className="mt-5 block text-sm font-medium">
                  Descripción
                  <input
                    className={input}
                    maxLength={160}
                    onChange={(event) =>
                      setEditForm({ ...editForm, description: event.target.value })
                    }
                    value={editForm.description}
                  />
                </label>
                <label className="mt-5 block text-sm font-medium">
                  Categoría
                  <select
                    className={input}
                    onChange={(event) =>
                      setEditForm({ ...editForm, categoryId: event.target.value })
                    }
                    value={editForm.categoryId}
                  >
                    <option value="">Seleccionar categoría</option>
                    {categories
                      .filter((category) => category.type === editForm.type)
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="mt-5 block text-sm font-medium">
                  Fecha
                  <input
                    className={input}
                    onChange={(event) =>
                      setEditForm({ ...editForm, occurredOn: event.target.value })
                    }
                    type="date"
                    value={editForm.occurredOn}
                  />
                </label>
                <label className="mt-5 block text-sm font-medium">
                  Nota{' '}
                  <span className="font-normal text-[var(--muted-foreground)]">
                    (opcional)
                  </span>
                  <textarea
                    className={`${input} h-24 py-3`}
                    maxLength={1000}
                    onChange={(event) =>
                      setEditForm({ ...editForm, note: event.target.value })
                    }
                    value={editForm.note}
                  />
                </label>
                {actionError && (
                  <p className="mt-4 text-sm text-[var(--destructive)]" role="alert">
                    {actionError}
                  </p>
                )}
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    className="min-h-11 rounded-lg border border-[var(--border)] px-4"
                    disabled={savingAction}
                    onClick={closeActions}
                    type="button"
                  >
                    Cancelar
                  </button>
                  <button
                    className="min-h-11 rounded-lg bg-[var(--primary)] px-4 font-medium text-[var(--primary-foreground)] disabled:opacity-60"
                    disabled={savingAction}
                    type="submit"
                  >
                    {savingAction ? 'Guardando…' : 'Guardar cambios'}
                  </button>
                </div>
              </form>
            )}
          </TransactionActionDialog>
        )}
      </main>
    </AppShell>
  );
}

function TransactionActionsMenu({
  item,
  onDelete,
  onEdit,
  onOpenChange,
  open,
}: {
  item: Item;
  onDelete: () => void;
  onEdit: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  return (
    <div
      className="relative inline-flex"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onOpenChange(false);
      }}
    >
      <button
        aria-controls={`transaction-actions-${item.id}`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Acciones para ${item.description}`}
      className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-raised)] hover:text-[var(--foreground)]"
        onClick={() => onOpenChange(!open)}
        type="button"
      >
        <svg aria-hidden="true" className="size-5 fill-current" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="12" cy="19" r="1.6" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute right-0 top-[calc(100%+2px)] z-30 w-28 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface-raised)] py-1 shadow-lg"
          id={`transaction-actions-${item.id}`}
          role="menu"
        >
          <button
          className="flex min-h-10 w-full cursor-pointer items-center gap-2 px-2 text-left text-sm hover:bg-[#343a41]"
            onClick={onEdit}
            role="menuitem"
            type="button"
          >
            <svg
              aria-hidden="true"
              className="size-4 fill-none stroke-current"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            >
              <path d="m4 20 4.2-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" />
              <path d="m13.8 7.2 3 3" />
            </svg>
            Editar
          </button>
          <button
          className="flex min-h-10 w-full cursor-pointer items-center gap-2 px-2 text-left text-sm text-[var(--expense)] hover:bg-[#4a292c]"
            onClick={onDelete}
            role="menuitem"
            type="button"
          >
            <svg
              aria-hidden="true"
              className="size-4 fill-none stroke-current"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            >
              <path d="M4 7h16M10 11v5M14 11v5M6 7l1 13h10l1-13M9 7V4h6v3" />
            </svg>
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}

function TransactionActionDialog({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end bg-black/60 p-4 md:items-center md:justify-center"
      role="dialog"
      aria-labelledby="transaction-action-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold" id="transaction-action-title">
            {title}
          </h2>
          <button
            aria-label="Cerrar"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-xl hover:bg-[var(--surface-raised)]"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
