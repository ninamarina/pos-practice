import { isValidDay, type DateRangePreset } from '@/lib/dates';
import type { PaymentMethod } from '@/types/domain';

// The filters of the Ventas screen. They live in the URL (single source of truth),
// so a filtered view survives a reload and can be shared as a link.
export type SalesFilters = {
  // Either a preset or a custom range of calendar days
  date: { type: 'preset'; preset: DateRangePreset } | { type: 'custom'; from: string; to: string };
  cashierId: string | null; // null = all cashiers
  method: PaymentMethod | null; // null = all methods
  folio: string | null; // when set, the other filters don't apply
  page: number;
};

export const DEFAULT_FILTERS: SalesFilters = {
  date: { type: 'preset', preset: 'today' },
  cashierId: null,
  method: null,
  folio: null,
  page: 1,
};

const PRESETS: DateRangePreset[] = ['today', 'yesterday', 'week', 'month'];
const METHODS: PaymentMethod[] = ['cash', 'card'];

type ReadableParams = Pick<URLSearchParams, 'get'>;

// URL → filters. Anything invalid (a link edited by hand, an old link) falls back to the default
// instead of breaking the screen.
export function parseFilters(params: ReadableParams): SalesFilters {
  const from = params.get('from');
  const to = params.get('to');
  const range = params.get('range');
  const method = params.get('method');
  const folio = params.get('folio')?.trim();
  const page = Number(params.get('page'));

  return {
    date:
      from && to && isValidDay(from) && isValidDay(to) && from <= to
        ? { type: 'custom', from, to }
        : PRESETS.includes(range as DateRangePreset)
          ? { type: 'preset', preset: range as DateRangePreset }
          : DEFAULT_FILTERS.date,
    cashierId: params.get('cashierId') || null,
    method: METHODS.includes(method as PaymentMethod) ? (method as PaymentMethod) : null,
    folio: folio && /^\d+$/.test(folio) ? folio : null,
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  };
}

// Filters → URL. Default values are left out so links stay short ("/ventas" = today, everyone).
// The other filters stay in the URL while searching by folio, so clearing the folio brings them back.
export function filtersToSearchParams(filters: SalesFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.date.type === 'custom') {
    params.set('from', filters.date.from);
    params.set('to', filters.date.to);
  } else if (filters.date.preset !== 'today') {
    params.set('range', filters.date.preset);
  }
  if (filters.cashierId) params.set('cashierId', filters.cashierId);
  if (filters.method) params.set('method', filters.method);
  if (filters.folio) params.set('folio', filters.folio);
  if (filters.page > 1) params.set('page', String(filters.page));
  return params;
}

// Changing any filter goes back to page 1: page 3 of the old filters may not exist with the new ones
export function updateFilters(current: SalesFilters, changes: Partial<Omit<SalesFilters, 'page'>>): SalesFilters {
  return { ...current, ...changes, page: 1 };
}

// Is anything narrowing the list besides the default "today"? Used to pick the right empty state.
export function hasNarrowingFilters(filters: SalesFilters): boolean {
  return filters.cashierId !== null || filters.method !== null;
}
