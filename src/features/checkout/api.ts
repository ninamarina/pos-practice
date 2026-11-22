import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { CreateSaleInput, Sale } from '@/types/domain';

export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSaleInput) =>
      api<Sale>('/api/sales', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => {
      // Stock changed and there's a new sale in the history
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
  });
}
