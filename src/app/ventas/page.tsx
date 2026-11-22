'use client';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { useSales } from '@/features/sales/api';
import { SalesTable } from '@/features/sales/components/SalesTable';
import { formatMoney } from '@/lib/money';

export default function SalesPage() {
  const sales = useSales();

  return (
    <div className="mx-auto w-full max-w-5xl p-4">
      <div className="mb-4 flex items-end justify-between">
        <h1 className="text-xl font-semibold">Ventas</h1>
        {sales.data && (
          <p className="text-sm text-slate-600">
            {sales.data.length} ventas · {formatMoney(sales.data.reduce((sum, sale) => sum + sale.total, 0))}
          </p>
        )}
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {sales.isPending ? (
          <LoadingState label="Cargando ventas…" />
        ) : sales.isError ? (
          <ErrorState message="No se pudieron cargar las ventas" onRetry={() => sales.refetch()} />
        ) : sales.data.length === 0 ? (
          <EmptyState>Todavía no hay ventas</EmptyState>
        ) : (
          <SalesTable sales={sales.data} />
        )}
      </div>
    </div>
  );
}
