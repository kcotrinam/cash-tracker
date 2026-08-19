import { authenticatedFetch, getApiUrl } from './authenticated-fetch';

export type CurrencyCode = 'PEN' | 'USD';

export async function getDefaultCurrency(): Promise<CurrencyCode> {
  const response = await authenticatedFetch(`${getApiUrl()}/settings/preferences`);
  if (!response.ok) throw new Error();
  const preferences = (await response.json()) as { defaultCurrency?: CurrencyCode };
  return preferences.defaultCurrency === 'USD' ? 'USD' : 'PEN';
}
