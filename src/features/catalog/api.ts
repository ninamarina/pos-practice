import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Category, Product } from '@/types/domain';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => api<Product[]>('/api/products'),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api<Category[]>('/api/categories'),
    staleTime: Infinity,
  });
}
