'use client';

import { DEMO_USERS, useSession } from './SessionProvider';

const ROLE_LABEL = { owner: 'Dueña', cashier: 'Cajero' } as const;

export function UserSwitcher() {
  const { user, setUserId } = useSession();

  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      <span className="hidden sm:inline">Usuario</span>
      <select
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-slate-900"
        value={user.id}
        onChange={event => setUserId(event.target.value)}
      >
        {DEMO_USERS.map(u => (
          <option key={u.id} value={u.id}>
            {u.name} ({ROLE_LABEL[u.role]})
          </option>
        ))}
      </select>
    </label>
  );
}
