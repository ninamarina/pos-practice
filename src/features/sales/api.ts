import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api, ApiRequestError } from '@/lib/api-client';
import type { Sale, SalesPage, User } from '@/types/domain';
import type { SalesFilters } from './filters';

// What the list query depends on. The folio is not here: it has its own query.
type SalesListParams = Pick<SalesFilters, 'date' | 'cashierId' | 'method' | 'page'> & { asOf: string };

function toApiQuery({ date, cashierId, method, page, asOf }: SalesListParams): string {
  const params = new URLSearchParams({ page: String(page), asOf });
  if (date.type === 'custom') {
    params.set('from', date.from);
    params.set('to', date.to);
  } else {
    params.set('range', date.preset);
  }
  if (cashierId) params.set('cashierId', cashierId);
  if (method) params.set('method', method);
  return params.toString();
}

export function useSalesPage(params: SalesListParams, { enabled }: { enabled: boolean }) {
  return useQuery({
    // Each combination of filters and page is its own cache entry: going back to one is instant
    queryKey: ['sales', 'list', params],
    // signal: if the filters change before the response arrives, React Query aborts this request
    queryFn: ({ signal }) => api<SalesPage>(`/api/sales?${toApiQuery(params)}`, { signal }),
    // While the next page or filter loads, keep showing the previous data (dimmed) instead of a spinner
    placeholderData: keepPreviousData,
    // The list is frozen at `asOf`, so polling only updates `newerCount` ("Hay 3 ventas nuevas")
    refetchInterval: 30_000,
    enabled,
  });
}

export function useSaleByFolio(folio: string | null) {
  return useQuery({
    queryKey: ['sales', 'folio', folio],
    queryFn: ({ signal }) => api<Sale>(`/api/sales/by-folio/${folio}`, { signal }),
    enabled: folio !== null,
    // A 404 is an answer ("that folio doesn't exist"), not a failure worth retrying
    retry: (failureCount, error) => !(error instanceof ApiRequestError && error.status === 404) && failureCount < 3,
  });
}

export function useCashiers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => api<User[]>('/api/users'),
    staleTime: Infinity,
  });
}
