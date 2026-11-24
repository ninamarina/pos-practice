import { keepPreviousData, useQuery, type QueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Category, Product } from '@/types/domain';

export type ProductFilters = {
  q?: string;
  categoryId?: string | null;
  lowStock?: boolean;
  limit: number;
};

// The search runs on the server: the browser never downloads the whole catalog.
// We ask for one more than the limit to know whether there are more results than we show
export function useProducts({ q, categoryId, lowStock, limit }: ProductFilters) {
  const params = new URLSearchParams({ limit: String(limit + 1) });
  if (q?.trim()) params.set('q', q.trim());
  if (categoryId) params.set('categoryId', categoryId);
  if (lowStock) params.set('lowStock', '1');

  return useQuery({
    queryKey: ['products', 'list', { q: q?.trim() ?? '', categoryId: categoryId ?? null, lowStock: !!lowStock, limit }],
    queryFn: ({ signal }) => api<Product[]>(`/api/products?${params}`, { signal }),
    // The catalog changes rarely, and our own changes update the cache directly
    staleTime: 5 * 60_000,
    // Keep showing the previous results while the next search loads, instead of a spinner on every keystroke
    placeholderData: keepPreviousData,
    select: products => ({ products: products.slice(0, limit), hasMore: products.length > limit }),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api<Category[]>('/api/categories'),
    staleTime: Infinity,
  });
}

// Applies a change to a product everywhere it's cached (every search result and its detail), without refetching.
// Search results that the change would move in or out (for example, stock below 5) are refetched instead
export function updateCachedProducts(queryClient: QueryClient, update: (product: Product) => Product) {
  queryClient.setQueriesData<Product[] | Product>({ queryKey: ['products'] }, data => {
    if (!data) return data;
    return Array.isArray(data) ? data.map(update) : update(data);
  });
  queryClient.invalidateQueries({
    queryKey: ['products', 'list'],
    predicate: query => (query.queryKey[2] as { lowStock?: boolean } | undefined)?.lowStock === true,
  });
}
