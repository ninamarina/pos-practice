'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { DEFAULT_FILTERS, filtersToSearchParams, parseFilters, updateFilters, type SalesFilters } from './filters';

// Reads and writes the filters in the URL. There's no useState for them: the URL is the only source of truth.
export function useSalesFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const filters = parseFilters(searchParams);

  function navigate(next: SalesFilters) {
    const query = filtersToSearchParams(next).toString();
    // replace, not push: each filter tweak doesn't pile up in the history, so "back" leaves the screen.
    // Trade-off: "back" can't undo a filter change.
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return {
    filters,
    changeFilters: (changes: Partial<Omit<SalesFilters, 'page'>>) => navigate(updateFilters(filters, changes)),
    goToPage: (page: number) => navigate({ ...filters, page }),
    resetFilters: () => navigate(DEFAULT_FILTERS),
  };
}
