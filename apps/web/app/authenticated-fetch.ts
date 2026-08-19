const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class SessionExpiredError extends Error {
  constructor() {
    super('Your session has expired.');
    this.name = 'SessionExpiredError';
  }
}

function redirectToLogin() {
  if (typeof window === 'undefined' || window.location.pathname === '/login') return;

  const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const params = new URLSearchParams({ reason: 'session-expired', returnTo });
  window.location.replace(`/login?${params.toString()}`);
}

export async function authenticatedFetch(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, { ...init, credentials: init?.credentials ?? 'include' });

  if (response.status === 401) {
    redirectToLogin();
    throw new SessionExpiredError();
  }

  return response;
}

export function getApiUrl() {
  return apiUrl;
}
