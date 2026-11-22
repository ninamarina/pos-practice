import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Product, UpdateProductInput } from '@/types/domain';

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => api<Product>(`/api/products/${id}`),
  });
}

export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProductInput) =>
      api<Product>(`/api/products/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
