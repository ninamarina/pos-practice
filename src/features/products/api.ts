import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { updateCachedProducts } from '@/features/catalog/api';
import { api } from '@/lib/api-client';
import type { Product, UpdateProductInput } from '@/types/domain';

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => api<Product>(`/api/products/${id}`),
    // The edit form starts from this data, so load it fresh every time the page opens
    staleTime: 0,
  });
}

export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProductInput) =>
      api<Product>(`/api/products/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    // The response is the updated product: put it in the cache instead of refetching the catalog
    onSuccess: updated => {
      updateCachedProducts(queryClient, product => (product.id === updated.id ? updated : product));
    },
  });
}
