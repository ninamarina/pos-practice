'use client';

import { createContext, use, useState, type ReactNode } from 'react';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { setCurrentUserId } from '@/lib/api-client';
import type { User } from '@/types/domain';
import { useUsers } from './api';

// No real auth in this prototype: the current user is picked from the header.
// The list of users comes from the API, the single source of truth

type Session = {
  user: User;
  users: User[];
  setUserId: (id: string) => void;
};

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const users = useUsers();
  const [userId, setUserId] = useState<string | null>(null);

  if (users.isPending) return <LoadingState />;
  if (users.isError) return <ErrorState message="No se pudieron cargar los usuarios" onRetry={() => users.refetch()} />;

  // Starts as the first cashier until someone picks another user
  const user = users.data.find(u => u.id === userId) ?? users.data.find(u => u.role === 'cashier') ?? users.data[0];
  setCurrentUserId(user.id);

  return <SessionContext value={{ user, users: users.data, setUserId }}>{children}</SessionContext>;
}

export function useSession() {
  const session = use(SessionContext);
  if (!session) throw new Error('useSession must be used inside <SessionProvider>');
  return session;
}
