'use client';

import { Fragment, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { useSession } from '@/features/session/SessionProvider';
import { formatMoney } from '@/lib/money';
import { STORE_TIME_ZONE } from '@/lib/store-config';
import type { Sale } from '@/types/domain';

// Times are shown in the store's time zone, the same one the date filters use
const dateFormatter = new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'short', timeZone: STORE_TIME_ZONE });

export function SalesTable({ sales, defaultExpandedId = null }: { sales: Sale[]; defaultExpandedId?: string | null }) {
  const { users } = useSession();
  const [expandedId, setExpandedId] = useState<string | null>(defaultExpandedId);

  return (
    <table className="w-full text-sm">
      {/* Sticky header while the rows scroll. The bottom line is a shadow: with border-collapse, a border on a sticky row disappears */}
      <thead className="sticky top-0 z-10 bg-white text-left text-slate-500 shadow-[inset_0_-1px_0_var(--color-slate-200)]">
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
          const cashier = users.find(u => u.id === sale.cashierId)?.name ?? sale.cashierId;
          return (
            <Fragment key={sale.id}>
              {/* The row is clickable for the mouse; the button in the first cell is what works with the keyboard and screen readers */}
              <tr
                onClick={() => setExpandedId(expanded ? null : sale.id)}
                className="cursor-pointer hover:bg-slate-50"
              >
                <td className="px-4 py-2 font-medium">
                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={`sale-${sale.id}`}
                    aria-label={`Venta #${sale.folio}, ${expanded ? 'ocultar' : 'ver'} detalle`}
                    onClick={event => {
                      event.stopPropagation();
                      setExpandedId(expanded ? null : sale.id);
                    }}
                    className="flex items-center gap-1 rounded"
                  >
                    <span aria-hidden className={`text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`}>›</span>
                    #{sale.folio}
                  </button>
                </td>
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
                <tr id={`sale-${sale.id}`} className="bg-slate-50">
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
