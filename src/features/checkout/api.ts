import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateCachedProducts } from '@/features/catalog/api';
import { api } from '@/lib/api-client';
import type { CreateSaleInput, CreateSaleResult } from '@/types/domain';

type CreateSaleVariables = {
  input: CreateSaleInput;
  // Generated once per checkout attempt and reused on retries, so a retry never registers the sale twice
  idempotencyKey: string;
};

export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, idempotencyKey }: CreateSaleVariables) =>
      api<CreateSaleResult>('/api/sales', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify(input),
      }),
    onSuccess: ({ stock }) => {
      // The response has the stock left of each product sold: update just those, instead of refetching the catalog
      updateCachedProducts(queryClient, product =>
        product.id in stock ? { ...product, stock: stock[product.id] } : product,
      );
      // The history isn't on screen while selling, so this only marks it stale; it refetches when someone opens it
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
  });
}
