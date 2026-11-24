'use client';

import { useSession } from './SessionProvider';

const ROLE_LABEL = { owner: 'Dueña', cashier: 'Cajero' } as const;

export function UserSwitcher() {
  const { user, users, setUserId } = useSession();

  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      <span className="hidden sm:inline">Usuario</span>
      {/* Compact for the header, so it doesn't use <Select>; it shares the same chevron */}
      <select
        className="select-chevron rounded-md border border-slate-300 bg-white py-1 pr-8 pl-2 text-slate-900"
        value={user.id}
        onChange={event => setUserId(event.target.value)}
      >
        {users.map(u => (
          <option key={u.id} value={u.id}>
            {u.name} ({ROLE_LABEL[u.role]})
          </option>
        ))}
      </select>
    </label>
  );
}
