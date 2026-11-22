'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { UserSwitcher } from '@/features/session/UserSwitcher';

const NAV = [
  { href: '/', label: 'Vender' },
  { href: '/ventas', label: 'Ventas' },
  { href: '/productos', label: 'Productos' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-dvh flex-col bg-slate-50 text-slate-900">
      <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold text-emerald-700">Tiendita POS</span>
          <nav className="flex gap-1">
            {NAV.map(item => {
              const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <UserSwitcher />
      </header>
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</main>
    </div>
  );
}
