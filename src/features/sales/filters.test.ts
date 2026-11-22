import { describe, expect, it } from 'vitest';
import { DEFAULT_FILTERS, filtersToSearchParams, parseFilters, updateFilters, type SalesFilters } from './filters';

const parse = (query: string) => parseFilters(new URLSearchParams(query));

describe('parseFilters', () => {
  it('uses the defaults for an empty URL: today, everyone, page 1', () => {
    expect(parse('')).toEqual(DEFAULT_FILTERS);
  });

  it('reads every filter from the URL', () => {
    expect(parse('from=2026-11-01&to=2026-11-15&cashierId=usr_luis&method=card&folio=1032&page=3')).toEqual({
      date: { type: 'custom', from: '2026-11-01', to: '2026-11-15' },
      cashierId: 'usr_luis',
      method: 'card',
      folio: '1032',
      page: 3,
    });
  });

  it('falls back to the defaults for values edited by hand', () => {
    expect(parse('range=forever&method=bitcoin&folio=abc&page=-2')).toEqual(DEFAULT_FILTERS);
    expect(parse('from=2026-11-15&to=2026-11-01').date).toEqual(DEFAULT_FILTERS.date); // backwards range
    expect(parse('from=2026-02-30&to=2026-03-01').date).toEqual(DEFAULT_FILTERS.date); // impossible day
  });
});

describe('filtersToSearchParams', () => {
  it('leaves the defaults out so links stay short', () => {
    expect(filtersToSearchParams(DEFAULT_FILTERS).toString()).toBe('');
  });

  it('round-trips through the URL', () => {
    const filters: SalesFilters = {
      date: { type: 'preset', preset: 'week' },
      cashierId: 'usr_ana',
      method: 'cash',
      folio: null,
      page: 2,
    };
    expect(parseFilters(filtersToSearchParams(filters))).toEqual(filters);
  });

  it('keeps the other filters while searching by folio, so clearing it brings them back', () => {
    const withFolio = updateFilters({ ...DEFAULT_FILTERS, method: 'card' }, { folio: '1032' });
    const params = filtersToSearchParams(withFolio);
    expect(params.get('method')).toBe('card');

    const cleared = updateFilters(parseFilters(params), { folio: null });
    expect(cleared.method).toBe('card');
  });
});

describe('updateFilters', () => {
  it('goes back to page 1 when a filter changes', () => {
    expect(updateFilters({ ...DEFAULT_FILTERS, page: 3 }, { method: 'card' }).page).toBe(1);
  });
});
