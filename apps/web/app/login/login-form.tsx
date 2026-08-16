'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useId, useRef, useState } from 'react';

type AlertKind = 'error' | 'session-expired' | 'network';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function safeReturnUrl(value: string | null) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/dashboard';
}

function AlertIcon() {
  return (
    <svg
      aria-hidden="true"
      className="mt-0.5 size-5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 7.5v5M12 16h.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  ) : (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
      <path
        d="m3 3 18 18M10.7 6.2A10.7 10.7 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3.1 3.7M6.1 6.1C3.8 7.8 2.5 10 2.5 12S6 18 12 18c1.2 0 2.3-.2 3.3-.6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const alertRef = useRef<HTMLElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<AlertKind | null>(
    searchParams.get('reason') === 'session-expired' ? 'session-expired' : null,
  );
  const [fieldError, setFieldError] = useState<'email' | 'password' | null>(null);

  useEffect(() => {
    if (alert) alertRef.current?.focus();
  }, [alert]);

  useEffect(() => {
    if (searchParams.get('reason') === 'session-expired') return;

    void fetch(`${apiUrl}/auth/me`, { credentials: 'include' })
      .then((response) => {
        if (response.ok) router.replace(safeReturnUrl(searchParams.get('returnTo')));
      })
      .catch(() => undefined);
  }, [router, searchParams]);

  const alertMessage = {
    error: 'El correo o la contraseña son incorrectos.',
    'session-expired': 'Tu sesión expiró. Inicia sesión nuevamente.',
    network: 'No pudimos conectarnos. Inténtalo nuevamente.',
  } as const;

  function clearError() {
    if (alert) setAlert(null);
  }

  function setAlertElement(node: HTMLElement | null) {
    alertRef.current = node;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setFieldError('email');
      emailRef.current?.focus();
      return;
    }
    if (!password) {
      setFieldError('password');
      passwordRef.current?.focus();
      return;
    }

    setFieldError(null);
    setAlert(null);
    setLoading(true);

    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      if (response.ok) {
        setPassword('');
        router.replace(safeReturnUrl(searchParams.get('returnTo')));
        return;
      }

      setPassword('');
      setAlert(response.status === 401 ? 'error' : 'network');
    } catch {
      setAlert('network');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[390px]">
      <p className="mb-12 text-[32px] font-semibold leading-tight tracking-[-0.03em] text-[var(--foreground)] lg:hidden">
        CashTracker
      </p>

      {alert && alert !== 'error' && (
        <div
          aria-live="assertive"
          className="mb-10 flex gap-3 rounded-lg bg-[var(--destructive)] px-4 py-3 text-sm font-medium leading-5 text-[var(--destructive-foreground)]"
          ref={setAlertElement}
          role="alert"
          tabIndex={-1}
        >
          <AlertIcon />
          <p>{alertMessage[alert]}</p>
        </div>
      )}

      <header className="mb-9">
        <h1 className="text-2xl font-medium tracking-[-0.02em]">Bienvenido de nuevo</h1>
        <p className="mt-2 text-base leading-6 text-[var(--muted-foreground)]">
          Inicia sesión para continuar con tus finanzas.
        </p>
      </header>

      <form noValidate onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div>
            <label
              className="mb-2 block text-[13px] font-medium tracking-[0.02em] text-[var(--muted-foreground)]"
              htmlFor={emailId}
            >
              Correo electrónico
            </label>
            <input
              aria-describedby={
                fieldError === 'email'
                  ? `${emailId}-error`
                  : alert === 'error'
                    ? `${passwordId}-error`
                    : undefined
              }
              aria-invalid={fieldError === 'email' || alert === 'error'}
              autoComplete="email"
              className={`h-12 w-full rounded-lg border bg-[var(--input)] px-4 text-base text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)] transition-colors focus:border-[var(--focus-ring)] focus:ring-1 focus:ring-[var(--focus-ring)] ${alert === 'error' ? 'border-[var(--destructive-foreground)]' : ''}`}
              id={emailId}
              inputMode="email"
              name="email"
              onChange={(event) => {
                setEmail(event.target.value);
                setFieldError(null);
                clearError();
              }}
              placeholder="nombre@ejemplo.com"
              ref={emailRef}
              required
              type="email"
              value={email}
            />
            {fieldError === 'email' && (
              <p
                className="mt-2 text-sm text-[var(--destructive-foreground)]"
                id={`${emailId}-error`}
              >
                Ingresa un correo electrónico válido.
              </p>
            )}
          </div>

          <div>
            <label
              className="mb-2 block text-[13px] font-medium tracking-[0.02em] text-[var(--muted-foreground)]"
              htmlFor={passwordId}
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                aria-describedby={
                  fieldError === 'password' || alert === 'error'
                    ? `${passwordId}-error`
                    : undefined
                }
                aria-invalid={fieldError === 'password' || alert === 'error'}
                autoComplete="current-password"
                className={`h-12 w-full rounded-lg border bg-[var(--input)] py-0 pl-4 pr-12 text-base text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)] transition-colors focus:border-[var(--focus-ring)] focus:ring-1 focus:ring-[var(--focus-ring)] ${alert === 'error' ? 'border-[var(--destructive-foreground)]' : ''}`}
                id={passwordId}
                name="password"
                onChange={(event) => {
                  setPassword(event.target.value);
                  setFieldError(null);
                  clearError();
                }}
                placeholder="••••••••"
                ref={passwordRef}
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
              />
              <button
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-0 top-0 flex size-12 items-center justify-center rounded-r-lg text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
                onClick={() => setShowPassword((visible) => !visible)}
                type="button"
              >
                <EyeIcon visible={showPassword} />
              </button>
            </div>
            {(fieldError === 'password' || alert === 'error') && (
              <p
                className="mt-2 text-sm text-[var(--destructive-foreground)]"
                id={`${passwordId}-error`}
                ref={alert === 'error' ? setAlertElement : undefined}
                role={alert === 'error' ? 'alert' : undefined}
                tabIndex={alert === 'error' ? -1 : undefined}
              >
                {alert === 'error' ? alertMessage.error : 'Ingresa tu contraseña.'}
              </p>
            )}
          </div>
        </div>

        <button
          className="mt-10 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 text-base font-medium text-[var(--primary-foreground)] transition-colors hover:bg-[#e1e3e2] disabled:cursor-not-allowed disabled:opacity-80"
          disabled={loading}
          type="submit"
        >
          {loading && (
            <span
              aria-hidden="true"
              className="size-4 animate-spin rounded-full border-2 border-[var(--primary-foreground)] border-r-transparent"
            />
          )}
          {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>

        <p className="mt-7 text-center text-[13px] leading-5 text-[var(--muted-foreground)]">
          ¿Aún no tienes una cuenta?{' '}
          <Link
            className="font-medium text-[var(--foreground)] underline decoration-[var(--border)] underline-offset-4 transition-colors hover:decoration-current"
            href="/register"
          >
            Crear cuenta
          </Link>
        </p>
      </form>
    </div>
  );
}
