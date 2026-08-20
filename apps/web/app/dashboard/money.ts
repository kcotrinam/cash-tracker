/** Decimal-string operations backed by integer cents; never use floats for financial totals. */
export function toCents(value: string): bigint {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(value);
  if (!match) throw new Error(`Invalid monetary amount: ${value}`);
  const sign = match[1] === '-' ? BigInt(-1) : BigInt(1);
  return (
    sign * (BigInt(match[2]!) * BigInt(100) + BigInt((match[3] ?? '').padEnd(2, '0')))
  );
}
export function fromCents(value: bigint): string {
  const zero = BigInt(0);
  const hundred = BigInt(100);
  const absolute = value < zero ? -value : value;
  return `${value < zero ? '-' : ''}${absolute / hundred}.${String(absolute % hundred).padStart(2, '0')}`;
}
export function sumAmounts(values: string[]): string {
  return fromCents(values.reduce((total, value) => total + toCents(value), BigInt(0)));
}
export function subtractAmounts(left: string, right: string): string {
  return fromCents(toCents(left) - toCents(right));
}
export function formatMoney(
  value: string,
  currency: string,
  signed = false,
  locale = 'es-PE',
): string {
  const zero = BigInt(0);
  const hundred = BigInt(100);
  const cents = toCents(value);
  const absolute = cents < zero ? -cents : cents;
  const whole = absolute / hundred;
  const decimal = String(absolute % hundred).padStart(2, '0');
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(
    whole,
  );
  const currencyPart =
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      currencyDisplay: 'symbol',
    })
      .formatToParts(0)
      .find((part) => part.type === 'currency')?.value ?? currency;
  return `${cents < zero ? '−' : signed && cents > zero ? '+' : ''}${currencyPart}\u00a0${number}.${decimal}`;
}
