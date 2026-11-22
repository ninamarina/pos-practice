'use client';

import { Fragment, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { DEMO_USERS } from '@/features/session/SessionProvider';
import { formatMoney } from '@/lib/money';
import type { Sale } from '@/types/domain';

const dateFormatter = new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'short' });

export function SalesTable({ sales }: { sales: Sale[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <table className="w-full text-sm">
      <thead className="border-b border-slate-200 text-left text-slate-500">
        <tr>
          <th className="px-4 py-2 font-medium">Folio</th>
          <th className="px-4 py-2 font-medium">Fecha</th>
          <th className="px-4 py-2 font-medium">Cajero</th>
          <th className="px-4 py-2 font-medium">Artículos</th>
          <th className="px-4 py-2 font-medium">Pago</th>
          <th className="px-4 py-2 text-right font-medium">Total</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {sales.map(sale => {
          const expanded = expandedId === sale.id;
          const cashier = DEMO_USERS.find(u => u.id === sale.cashierId)?.name ?? sale.cashierId;
          return (
            <Fragment key={sale.id}>
              <tr
                onClick={() => setExpandedId(expanded ? null : sale.id)}
                className="cursor-pointer hover:bg-slate-50"
              >
                <td className="px-4 py-2 font-medium">#{sale.folio}</td>
                <td className="px-4 py-2 text-slate-600">{dateFormatter.format(new Date(sale.createdAt))}</td>
                <td className="px-4 py-2">{cashier}</td>
                <td className="px-4 py-2">{sale.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                <td className="px-4 py-2">
                  <Badge tone={sale.paymentMethod === 'card' ? 'neutral' : 'success'}>
                    {sale.paymentMethod === 'card' ? 'Tarjeta' : 'Efectivo'}
                  </Badge>
                </td>
                <td className="px-4 py-2 text-right font-semibold tabular-nums">{formatMoney(sale.total)}</td>
              </tr>
              {expanded && (
                <tr className="bg-slate-50">
                  <td colSpan={6} className="px-4 py-3">
                    <ul className="space-y-1">
                      {sale.items.map(item => (
                        <li key={item.productId} className="flex justify-between gap-4">
                          <span>{item.quantity} × {item.name}</span>
                          <span className="tabular-nums">{formatMoney(item.unitPrice * item.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                    {sale.change !== null && (
                      <p className="mt-2 text-slate-500">
                        Recibido {formatMoney(sale.cashReceived ?? 0)} · Cambio {formatMoney(sale.change)}
                      </p>
                    )}
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}
