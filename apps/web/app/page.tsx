const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-6 py-12">
      <section className="w-full rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm sm:p-12">
        <p className="text-sm font-medium tracking-wide text-[var(--muted)]">
          CashTracker
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
          Your space to understand the month.
        </h1>
        <p className="mt-4 max-w-prose leading-7 text-[var(--muted)]">
          The application foundation is running. Soon you will be able to record your
          income and expenses with calm and clarity.
        </p>
        <p className="mt-8 text-sm text-[var(--muted)]">
          Local API:{' '}
          <code className="rounded bg-[var(--subtle)] px-2 py-1">{apiUrl}</code>
        </p>
      </section>
    </main>
  );
}
