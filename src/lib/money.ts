const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

// Amounts are integer cents
export function formatMoney(cents: number) {
  return formatter.format(cents / 100);
}

export function parseMoney(input: string) {
  const value = Number(input.replace(/[^0-9.]/g, ''));
  return Number.isFinite(value) ? Math.round(value * 100) : NaN;
}
