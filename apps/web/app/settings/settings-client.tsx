'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { authenticatedFetch, getApiUrl } from '../authenticated-fetch';
import { AppShell } from '../components/app-shell';

type Section = 'overview' | 'profile' | 'preferences' | 'categories' | 'security';
type Currency = 'PEN' | 'USD';
type CategoryType = 'INCOME' | 'EXPENSE';
type Profile = { id: string; email: string; displayName: string };
type Preferences = { defaultCurrency: Currency; timezone: string };
type Category = {
  id: string;
  name: string;
  type: CategoryType;
  isDefault: boolean;
  isFallback: boolean;
  isActive: boolean;
};

const api = getApiUrl();
const input =
  'mt-2 h-12 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-base outline-none focus:border-[var(--focus-ring)] focus:ring-1 focus:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60';
const sections: {
  id: Exclude<Section, 'overview'>;
  label: string;
  description: string;
}[] = [
  { id: 'profile', label: 'Perfil', description: 'Tu nombre y correo electrónico' },
  { id: 'preferences', label: 'Preferencias', description: 'Moneda y zona horaria' },
  { id: 'categories', label: 'Categorías', description: 'Organiza ingresos y gastos' },
  { id: 'security', label: 'Seguridad', description: 'Cambia tu contraseña' },
];

function messageFrom(response: Response, fallback: string) {
  return response
    .json()
    .then((payload: { message?: string | string[] }) => {
      const message = payload?.message;
      return Array.isArray(message) ? message[0] : message || fallback;
    })
    .catch(() => fallback);
}

function SettingsHeader({ section }: { section: Section }) {
  const selected = section === 'overview' ? undefined : section;
  const title = selected
    ? sections.find((item) => item.id === selected)?.label
    : 'Configuración';
  return (
    <>
      <header className="flex min-h-16 items-center border-b border-[var(--border)] px-4 md:hidden">
        {selected && (
          <Link
            aria-label="Volver a Configuración"
            className="mr-3 flex size-11 items-center justify-center rounded-lg text-xl hover:bg-[var(--surface-raised)]"
            href="/settings"
          >
            ‹
          </Link>
        )}
        <h1 className="text-xl font-semibold tracking-[-0.02em]">{title}</h1>
      </header>
      <div className="hidden border-b border-[var(--border)] px-8 pt-9 md:block lg:px-12">
        <h1 className="text-2xl font-semibold tracking-[-0.03em]">Configuración</h1>
        <nav aria-label="Secciones de configuración" className="mt-7 flex gap-7">
          {sections.map((item) => (
            <Link
              aria-current={selected === item.id ? 'page' : undefined}
              className={`border-b-2 pb-4 text-sm transition-colors ${selected === item.id ? 'border-[var(--primary)] text-[var(--foreground)]' : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}
              href={`/settings/${item.id}`}
              key={item.id}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}

function Overview() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-5 md:hidden">
      <p className="mb-5 text-sm leading-6 text-[var(--muted-foreground)]">
        Ajusta cómo funciona CashTracker para ti.
      </p>
      <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
        {sections.map((item) => (
          <Link
            className="flex min-h-[72px] items-center justify-between gap-4 px-1 py-3 hover:bg-[var(--surface-low)]"
            href={`/settings/${item.id}`}
            key={item.id}
          >
            <span>
              <span className="block font-medium">{item.label}</span>
              <span className="mt-1 block text-sm text-[var(--muted-foreground)]">
                {item.description}
              </span>
            </span>
            <span aria-hidden="true" className="text-xl text-[var(--muted-foreground)]">
              ›
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}

function ProfileForm() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    authenticatedFetch(`${api}/users/me`)
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const value = (await r.json()) as Profile;
        setProfile(value);
        setName(value.displayName);
      })
      .catch(() => setError('No pudimos cargar tu perfil.'));
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError('Ingresa tu nombre.');
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const r = await authenticatedFetch(`${api}/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!r.ok) throw new Error(await messageFrom(r, 'No pudimos guardar los cambios.'));
      const value = (await r.json()) as Profile;
      setProfile(value);
      setName(value.displayName);
      setSuccess('Perfil actualizado correctamente.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos guardar los cambios.');
    } finally {
      setSaving(false);
    }
  }
  return (
    <Section title="Perfil" intro="Actualiza el nombre con el que te reconocemos.">
      <form onSubmit={submit} noValidate>
        <label htmlFor="display-name">Nombre completo</label>
        <input
          autoComplete="name"
          className={input}
          id="display-name"
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
          value={name}
        />
        <label
          className="mt-5 block text-[var(--muted-foreground)]"
          htmlFor="profile-email"
        >
          Correo electrónico
        </label>
        <input
          className={input}
          disabled
          id="profile-email"
          readOnly
          value={profile?.email ?? ''}
        />
        {error && (
          <p className="mt-4 text-sm text-[var(--destructive)]" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="mt-4 text-sm text-[var(--primary)]" role="status">
            {success}
          </p>
        )}
        <Submit saving={saving} label="Guardar cambios" />
      </form>
    </Section>
  );
}

function PreferencesForm() {
  const [preferences, setPreferences] = useState<Preferences>({
    defaultCurrency: 'PEN',
    timezone: 'America/Lima',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    authenticatedFetch(`${api}/settings/preferences`)
      .then(async (r) => {
        if (!r.ok) throw new Error();
        setPreferences((await r.json()) as Preferences);
      })
      .catch(() => setError('No pudimos cargar tus preferencias.'));
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const r = await authenticatedFetch(`${api}/settings/preferences`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });
      if (!r.ok)
        throw new Error(await messageFrom(r, 'No pudimos guardar las preferencias.'));
      setPreferences((await r.json()) as Preferences);
      setSuccess('Preferencias actualizadas correctamente.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos guardar las preferencias.');
    } finally {
      setSaving(false);
    }
  }
  return (
    <Section
      title="Preferencias"
      intro="Estos valores se usarán al crear nuevos movimientos y recurrencias."
    >
      <form onSubmit={submit}>
        <label htmlFor="currency">Moneda predeterminada</label>
        <select
          className={input}
          id="currency"
          onChange={(e) =>
            setPreferences((v) => ({ ...v, defaultCurrency: e.target.value as Currency }))
          }
          value={preferences.defaultCurrency}
        >
          <option value="PEN">PEN — Sol peruano</option>
          <option value="USD">USD — Dólar estadounidense</option>
        </select>
        <p className="mt-2 text-sm leading-5 text-[var(--muted-foreground)]">
          No modifica tus movimientos existentes.
        </p>
        <label className="mt-6 block" htmlFor="timezone">
          Zona horaria
        </label>
        <input
          className={input}
          id="timezone"
          list="timezones"
          onChange={(e) => setPreferences((v) => ({ ...v, timezone: e.target.value }))}
          value={preferences.timezone}
        />
        <datalist id="timezones">
          <option value="America/Lima" />
          <option value="America/Bogota" />
          <option value="America/Mexico_City" />
          <option value="America/Santiago" />
          <option value="America/Argentina/Buenos_Aires" />
        </datalist>
        <p className="mt-2 text-sm leading-5 text-[var(--muted-foreground)]">
          Afecta el procesamiento futuro de recurrencias, no las fechas históricas.
        </p>
        {error && (
          <p className="mt-4 text-sm text-[var(--destructive)]" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="mt-4 text-sm text-[var(--primary)]" role="status">
            {success}
          </p>
        )}
        <Submit saving={saving} label="Guardar cambios" />
      </form>
    </Section>
  );
}

function CategoriesForm() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [type, setType] = useState<CategoryType>('EXPENSE');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [deactivating, setDeactivating] = useState<Category | null>(null);
  const load = () =>
    authenticatedFetch(`${api}/categories?includeInactive=true`)
      .then(async (r) => {
        if (!r.ok) throw new Error();
        setCategories((await r.json()) as Category[]);
      })
      .catch(() => setError('No pudimos cargar las categorías.'));
  useEffect(() => {
    void load();
  }, []);
  async function create(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim()) return;
    setCreating(true);
    setError('');
    try {
      const r = await authenticatedFetch(`${api}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: draft, type }),
      });
      if (!r.ok) throw new Error(await messageFrom(r, 'No pudimos crear la categoría.'));
      setDraft('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos crear la categoría.');
    } finally {
      setCreating(false);
    }
  }
  async function rename(event: FormEvent) {
    event.preventDefault();
    if (!editing || !name.trim()) return;
    try {
      const r = await authenticatedFetch(`${api}/categories/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!r.ok) throw new Error(await messageFrom(r, 'No pudimos cambiar el nombre.'));
      setEditing(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos cambiar el nombre.');
    }
  }
  async function changeStatus(category: Category, isActive: boolean) {
    try {
      const r = await authenticatedFetch(`${api}/categories/${category.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      if (!r.ok)
        throw new Error(await messageFrom(r, 'No pudimos actualizar la categoría.'));
      setDeactivating(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos actualizar la categoría.');
    }
  }
  return (
    <Section
      title="Categorías"
      intro="Las categorías inactivas se conservan en tus movimientos, pero no aparecen al crear nuevos."
    >
      <form
        className="mb-8 flex flex-col gap-3 border-b border-[var(--border)] pb-7 sm:flex-row"
        onSubmit={create}
      >
        <input
          aria-label="Nueva categoría"
          className="h-12 flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-base"
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Nueva categoría"
          value={draft}
        />
        <select
          aria-label="Tipo de categoría"
          className="h-12 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3"
          onChange={(e) => setType(e.target.value as CategoryType)}
          value={type}
        >
          <option value="EXPENSE">Gasto</option>
          <option value="INCOME">Ingreso</option>
        </select>
        <button
          className="h-12 rounded-lg bg-[var(--primary)] px-5 font-medium text-[var(--primary-foreground)] disabled:opacity-60"
          disabled={creating}
          type="submit"
        >
          {creating ? 'Creando…' : 'Nueva categoría'}
        </button>
      </form>
      {error && (
        <p className="mb-5 text-sm text-[var(--destructive)]" role="alert">
          {error}
        </p>
      )}
      {(['EXPENSE', 'INCOME'] as CategoryType[]).map((categoryType) => (
        <CategoryGroup
          categories={categories.filter((c) => c.type === categoryType)}
          key={categoryType}
          onDeactivate={setDeactivating}
          onEdit={(c) => {
            setEditing(c);
            setName(c.name);
          }}
          onReactivate={(c) => void changeStatus(c, true)}
          title={categoryType === 'EXPENSE' ? 'Gastos' : 'Ingresos'}
        />
      ))}
      {editing && (
        <Dialog title="Cambiar nombre" onClose={() => setEditing(null)}>
          <form onSubmit={rename}>
            <label htmlFor="category-name">Nombre de categoría</label>
            <input
              autoFocus
              className={input}
              id="category-name"
              onChange={(e) => setName(e.target.value)}
              value={name}
            />
            <DialogActions label="Guardar" />
          </form>
        </Dialog>
      )}
      {deactivating && (
        <Dialog title="¿Desactivar categoría?" onClose={() => setDeactivating(null)}>
          <p className="text-sm leading-6 text-[var(--muted-foreground)]">
            {deactivating.name} seguirá apareciendo en tus movimientos anteriores.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              className="h-11 rounded-lg border border-[var(--border)] px-4"
              onClick={() => setDeactivating(null)}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="h-11 rounded-lg border border-[var(--destructive)] px-4 text-[var(--destructive)]"
              onClick={() => void changeStatus(deactivating, false)}
              type="button"
            >
              Desactivar
            </button>
          </div>
        </Dialog>
      )}
    </Section>
  );
}

function CategoryGroup({
  title,
  categories,
  onEdit,
  onDeactivate,
  onReactivate,
}: {
  title: string;
  categories: Category[];
  onEdit: (category: Category) => void;
  onDeactivate: (category: Category) => void;
  onReactivate: (category: Category) => void;
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
        {categories.map((category) => (
          <div className="flex min-h-16 items-center gap-3 py-3" key={category.id}>
            <div className="min-w-0 flex-1">
              <p
                className={
                  !category.isActive ? 'text-[var(--muted-foreground)] line-through' : ''
                }
              >
                {category.name}
              </p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {category.isFallback
                  ? 'Categoría predeterminada'
                  : category.isActive
                    ? 'Activa'
                    : 'Inactiva'}
              </p>
            </div>
            {category.isActive ? (
              <>
                <button
                  className="min-h-11 rounded-lg px-3 text-sm hover:bg-[var(--surface-raised)]"
                  onClick={() => onEdit(category)}
                  type="button"
                >
                  Editar
                </button>
                {!category.isFallback && (
                  <button
                    className="min-h-11 rounded-lg px-3 text-sm text-[var(--destructive)] hover:bg-[var(--surface-raised)]"
                    onClick={() => onDeactivate(category)}
                    type="button"
                  >
                    Desactivar
                  </button>
                )}
              </>
            ) : (
              <button
                className="min-h-11 rounded-lg px-3 text-sm hover:bg-[var(--surface-raised)]"
                onClick={() => onReactivate(category)}
                type="button"
              >
                Reactivar
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function SecurityForm() {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (form.newPassword !== form.confirmPassword)
      return setError('Las contraseñas nuevas no coinciden.');
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const r = await authenticatedFetch(`${api}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!r.ok)
        throw new Error(await messageFrom(r, 'No pudimos cambiar tu contraseña.'));
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccess('Contraseña actualizada. Cerramos las demás sesiones por seguridad.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos cambiar tu contraseña.');
    } finally {
      setSaving(false);
    }
  }
  const set = (name: keyof typeof form, value: string) =>
    setForm((v) => ({ ...v, [name]: value }));
  return (
    <Section
      title="Seguridad"
      intro="Al cambiar tu contraseña, cerraremos tus otras sesiones activas."
    >
      <form onSubmit={submit}>
        <label htmlFor="current-password">Contraseña actual</label>
        <input
          autoComplete="current-password"
          className={input}
          id="current-password"
          onChange={(e) => set('currentPassword', e.target.value)}
          type="password"
          value={form.currentPassword}
        />
        <label className="mt-5 block" htmlFor="new-password">
          Nueva contraseña
        </label>
        <input
          autoComplete="new-password"
          className={input}
          id="new-password"
          minLength={10}
          onChange={(e) => set('newPassword', e.target.value)}
          type="password"
          value={form.newPassword}
        />
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Usa al menos 10 caracteres.
        </p>
        <label className="mt-5 block" htmlFor="confirm-password">
          Confirmar nueva contraseña
        </label>
        <input
          autoComplete="new-password"
          className={input}
          id="confirm-password"
          minLength={10}
          onChange={(e) => set('confirmPassword', e.target.value)}
          type="password"
          value={form.confirmPassword}
        />
        {error && (
          <p className="mt-4 text-sm text-[var(--destructive)]" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="mt-4 text-sm text-[var(--primary)]" role="status">
            {success}
          </p>
        )}
        <Submit saving={saving} label="Guardar cambios" />
      </form>
    </Section>
  );
}

function Section({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-7 md:px-8 md:py-10 lg:px-12">
      <h2 className="text-2xl font-semibold tracking-[-0.03em]">{title}</h2>
      <p className="mt-2 mb-7 text-sm leading-6 text-[var(--muted-foreground)]">
        {intro}
      </p>
      {children}
    </main>
  );
}
function Submit({ saving, label }: { saving: boolean; label: string }) {
  return (
    <button
      className="mt-7 min-h-12 rounded-lg bg-[var(--primary)] px-5 font-medium text-[var(--primary-foreground)] disabled:opacity-60"
      disabled={saving}
      type="submit"
    >
      {saving ? 'Guardando…' : label}
    </button>
  );
}
function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end bg-black/60 p-4 md:items-center md:justify-center"
      role="dialog"
    >
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            aria-label="Cerrar"
            className="size-11 rounded-lg hover:bg-[var(--surface-raised)]"
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
function DialogActions({ label }: { label: string }) {
  return (
    <div className="mt-6 flex justify-end">
      <button
        className="h-11 rounded-lg bg-[var(--primary)] px-4 font-medium text-[var(--primary-foreground)]"
        type="submit"
      >
        {label}
      </button>
    </div>
  );
}

export function SettingsClient({ section }: { section: Section }) {
  return (
    <AppShell active="settings" screenClassName="settings-screen">
      <SettingsHeader section={section} />
      {section === 'overview' ? (
        <Overview />
      ) : section === 'profile' ? (
        <ProfileForm />
      ) : section === 'preferences' ? (
        <PreferencesForm />
      ) : section === 'categories' ? (
        <CategoriesForm />
      ) : (
        <SecurityForm />
      )}
    </AppShell>
  );
}
