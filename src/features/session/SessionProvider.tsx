'use client';

import { createContext, use, useState, type ReactNode } from 'react';
import type { User } from '@/types/domain';

// No real auth in this prototype: the current user is picked from the header
export const DEMO_USERS: User[] = [
  { id: 'usr_ana', name: 'Ana Torres', role: 'owner' },
  { id: 'usr_luis', name: 'Luis Méndez', role: 'cashier' },
];

type Session = {
  user: User;
  setUserId: (id: string) => void;
};

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState(DEMO_USERS[1].id);
  const user = DEMO_USERS.find(u => u.id === userId) ?? DEMO_USERS[1];

  return <SessionContext value={{ user, setUserId }}>{children}</SessionContext>;
}

export function useSession() {
  const session = use(SessionContext);
  if (!session) throw new Error('useSession must be used inside <SessionProvider>');
  return session;
}
