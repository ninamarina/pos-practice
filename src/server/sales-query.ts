import { addDays, daysInRange, dayInZone, isValidDay, resolvePreset, startOfDay, type DateRangePreset, type DayRange } from '@/lib/dates';
import type { PaymentMethod, Sale, SalesPage } from '@/types/domain';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
// Product didn't set a limit; we cap custom ranges so nobody asks for years of sales in one go
export const MAX_RANGE_DAYS = 366;

const PRESETS: DateRangePreset[] = ['today', 'yesterday', 'week', 'month'];
const METHODS: PaymentMethod[] = ['cash', 'card'];

export type SalesQuery = {
  range: DayRange;
  cashierId: string | null;
  method: PaymentMethod | null;
  page: number;
  pageSize: number;
  asOf: Date;
};

type ParseResult = { ok: true; query: SalesQuery } | { ok: false; message: string };

function parsePositiveInt(value: string | null, fallback: number): number | null {
  if (value === null) return fallback;
  return /^\d+$/.test(value) && Number(value) >= 1 ? Number(value) : null;
}

// Validates the query string of GET /api/sales. Days are interpreted in the store's time zone.
export function parseSalesQuery(params: URLSearchParams, timeZone: string, now: Date): ParseResult {
  const from = params.get('from');
  const to = params.get('to');
  const preset = params.get('range');

  let range: DayRange;
  if (from !== null || to !== null) {
    if (!from || !to || !isValidDay(from) || !isValidDay(to)) {
      return { ok: false, message: 'from y to deben ser fechas YYYY-MM-DD' };
    }
    if (from > to) return { ok: false, message: 'from no puede ser posterior a to' };
    range = { from, to };
    if (daysInRange(range) > MAX_RANGE_DAYS) {
      return { ok: false, message: `El rango no puede superar ${MAX_RANGE_DAYS} días` };
    }
  } else {
    if (preset !== null && !PRESETS.includes(preset as DateRangePreset)) {
      return { ok: false, message: `range debe ser uno de: ${PRESETS.join(', ')}` };
    }
    range = resolvePreset((preset as DateRangePreset | null) ?? 'today', dayInZone(now, timeZone));
  }

  const method = params.get('method');
  if (method !== null && !METHODS.includes(method as PaymentMethod)) {
    return { ok: false, message: `method debe ser uno de: ${METHODS.join(', ')}` };
  }

  const page = parsePositiveInt(params.get('page'), 1);
  const pageSize = parsePositiveInt(params.get('pageSize'), DEFAULT_PAGE_SIZE);
  if (page === null) return { ok: false, message: 'page debe ser un entero mayor o igual a 1' };
  if (pageSize === null || pageSize > MAX_PAGE_SIZE) {
    return { ok: false, message: `pageSize debe estar entre 1 y ${MAX_PAGE_SIZE}` };
  }

  // asOf freezes the result: sales created after it don't shift the pages while you browse them
  const asOfParam = params.get('asOf');
  const asOf = asOfParam === null ? now : new Date(asOfParam);
  if (Number.isNaN(asOf.getTime())) return { ok: false, message: 'asOf debe ser una fecha ISO 8601' };

  return {
    ok: true,
    query: { range, cashierId: params.get('cashierId'), method: method as PaymentMethod | null, page, pageSize, asOf },
  };
}

// `sales` must be sorted newest first, as the in-memory db keeps them
export function querySales(sales: Sale[], query: SalesQuery, timeZone: string): SalesPage {
  // The range is [start of `from`, start of the day after `to`), in the store's time zone
  const start = startOfDay(query.range.from, timeZone).getTime();
  const endExclusive = startOfDay(addDays(query.range.to, 1), timeZone).getTime();

  const matching = sales.filter(sale => {
    const createdAt = new Date(sale.createdAt).getTime();
    return (
      createdAt >= start &&
      createdAt < endExclusive &&
      (query.cashierId === null || sale.cashierId === query.cashierId) &&
      (query.method === null || sale.paymentMethod === query.method)
    );
  });

  const asOf = query.asOf.getTime();
  const snapshot = matching.filter(sale => new Date(sale.createdAt).getTime() <= asOf);
  const totalPages = Math.max(1, Math.ceil(snapshot.length / query.pageSize));
  const offset = (query.page - 1) * query.pageSize;

  return {
    items: snapshot.slice(offset, offset + query.pageSize),
    page: query.page,
    pageSize: query.pageSize,
    totalPages,
    summary: { count: snapshot.length, total: snapshot.reduce((sum, sale) => sum + sale.total, 0) },
    newerCount: matching.length - snapshot.length,
  };
}

