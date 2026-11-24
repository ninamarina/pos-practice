import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { User } from '@/types/domain';

// The store's users change rarely: fetch them once per session
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => api<User[]>('/api/users'),
    staleTime: Infinity,
  });
}
