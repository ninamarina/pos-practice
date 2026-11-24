import { describe, expect, it } from 'vitest';
import type { Sale } from '@/types/domain';
import { MAX_RANGE_DAYS, parseSalesQuery, querySales, type SalesQuery } from './sales-query';

const TZ = 'America/Mexico_City'; // UTC-6
const NOW = new Date('2026-11-19T18:00:00Z'); // noon in Mexico City

function sale(id: number, createdAt: string, overrides: Partial<Sale> = {}): Sale {
  return {
    id: `sale_${id}`,
    folio: 1000 + id,
    createdAt,
    cashierId: 'usr_luis',
    items: [],
    total: 10000,
    paymentMethod: 'cash',
    cashReceived: 10000,
    change: 0,
    ...overrides,
  };
}

function parse(query: string) {
  const result = parseSalesQuery(new URLSearchParams(query), TZ, NOW);
  if (!result.ok) throw new Error(result.message);
  return result.query;
}

describe('parseSalesQuery', () => {
  it('defaults to today in the store time zone, page 1 of 20, frozen at now', () => {
    expect(parse('')).toEqual({
      range: { from: '2026-11-19', to: '2026-11-19' },
      cashierId: null,
      method: null,
      page: 1,
      pageSize: 20,
      asOf: NOW,
    });
  });

  it.each([
    ['from=2026-11-01', 'from y to'],
    ['from=2026-11-10&to=2026-11-01', 'posterior'],
    [`from=2024-01-01&to=2026-11-19`, String(MAX_RANGE_DAYS)],
    ['range=forever', 'range'],
    ['method=bitcoin', 'method'],
    ['page=0', 'page'],
    ['pageSize=500', 'pageSize'],
    ['asOf=yesterday', 'asOf'],
  ])('rejects %s', (query, message) => {
    const result = parseSalesQuery(new URLSearchParams(query), TZ, NOW);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.message).toContain(message);
  });
});

describe('querySales', () => {
  // Newest first, like the db
  const sales = [
    sale(5, '2026-11-19T17:00:00Z', { paymentMethod: 'card', total: 50000 }), // Nov 19, 11:00
    sale(4, '2026-11-19T06:30:00Z', { cashierId: 'usr_ana' }), // Nov 19, 00:30
    sale(3, '2026-11-19T05:30:00Z'), // Nov 18, 23:30 in Mexico City (already the 19th in UTC)
    sale(2, '2026-11-18T12:00:00Z'),
    sale(1, '2026-11-10T12:00:00Z'),
  ];
  const base: SalesQuery = parse('');

  it('uses store days, not UTC days', () => {
    const result = querySales(sales, base, TZ);
    expect(result.items.map(s => s.id)).toEqual(['sale_5', 'sale_4']);
  });

  it('combines filters', () => {
    expect(querySales(sales, { ...base, cashierId: 'usr_ana' }, TZ).items.map(s => s.id)).toEqual(['sale_4']);
    expect(querySales(sales, { ...base, method: 'card' }, TZ).items.map(s => s.id)).toEqual(['sale_5']);
  });

  it('summarizes the whole filtered set, not just the page', () => {
    const range = { from: '2026-11-01', to: '2026-11-19' };
    const result = querySales(sales, { ...base, range, pageSize: 2 }, TZ);
    expect(result.items).toHaveLength(2);
    expect(result.totalPages).toBe(3);
    expect(result.summary).toEqual({ count: 5, total: 90000 });
  });

  it('freezes the list at asOf and counts the newer sales apart', () => {
    const result = querySales(sales, { ...base, asOf: new Date('2026-11-19T10:00:00Z') }, TZ);
    expect(result.items.map(s => s.id)).toEqual(['sale_4']);
    expect(result.newerCount).toBe(1);
  });

  it('returns an empty page past the end, with the real totals', () => {
    const result = querySales(sales, { ...base, page: 9 }, TZ);
    expect(result.items).toEqual([]);
    expect(result.summary.count).toBe(2);
  });
});
