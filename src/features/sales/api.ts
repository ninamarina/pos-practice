import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Sale } from '@/types/domain';

export function useSales() {
  return useQuery({
    queryKey: ['sales'],
    queryFn: () => api<Sale[]>('/api/sales'),
  });
}
