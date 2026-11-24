'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { ApiRequestError } from '@/lib/api-client';
import { formatMoney } from '@/lib/money';
import { useCashiers, useSaleByFolio, useSalesPage } from '../api';
import { hasNarrowingFilters, type SalesFilters } from '../filters';
import { useSalesFilters } from '../useSalesFilters';
import { SalesFilterBar } from './SalesFilterBar';
import { SalesTable } from './SalesTable';

const shortDate = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });

const PERIOD_PHRASES = { today: 'de hoy', yesterday: 'de ayer', week: 'de esta semana', month: 'de este mes' };

// "de hoy", "del 01/11 al 15/11": completes "No hay ventas …"
function describePeriod(date: SalesFilters['date']): string {
  if (date.type === 'preset') return PERIOD_PHRASES[date.preset];
  // Days are plain calendar dates, so format them as UTC to avoid shifting them a day
  return `del ${shortDate.format(new Date(date.from))} al ${shortDate.format(new Date(date.to))}`;
}

export function SalesView() {
  const { filters, changeFilters, goToPage } = useSalesFilters();
  const searchingFolio = filters.folio !== null;

  // The moment the list is frozen at (not in the URL: a shared link should show fresh data).
  // It's renewed when the filters change or the user asks for the new sales.
  const [asOf, setAsOf] = useState(() => new Date().toISOString());

  function handleFiltersChange(changes: Partial<Omit<SalesFilters, 'page'>>) {
    setAsOf(new Date().toISOString());
    changeFilters(changes);
  }

  function showNewerSales() {
    setAsOf(new Date().toISOString());
    goToPage(1);
  }

  const cashiers = useCashiers();
  const list = useSalesPage(
    { date: filters.date, cashierId: filters.cashierId, method: filters.method, page: filters.page, asOf },
    { enabled: !searchingFolio },
  );
  const folioSale = useSaleByFolio(filters.folio);

  const updating = !searchingFolio && list.isPlaceholderData;

  return (
    // Fills the height below the header (main is a flex column): only the table rows scroll,
    // so the filters and the pagination are always visible. min-h-0 lets it shrink below its content.
    <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-4 p-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-xl font-semibold">Ventas</h1>
        {!searchingFolio && list.data && (
          // The summary covers every sale that matches the filters, not just this page
          <p className={`text-sm text-slate-600 ${updating ? 'opacity-50' : ''}`} aria-live="polite">
            {list.data.summary.count} ventas · {formatMoney(list.data.summary.total)}
          </p>
        )}
      </div>

      <SalesFilterBar
        filters={filters}
        cashiers={cashiers.data ?? []}
        updating={updating}
        onChange={handleFiltersChange}
      />

      {!searchingFolio && list.data && list.data.newerCount > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <span>
            {list.data.newerCount === 1 ? 'Hay 1 venta nueva' : `Hay ${list.data.newerCount} ventas nuevas`}
          </span>
          <Button variant="secondary" onClick={showNewerSales}>Actualizar</Button>
        </div>
      )}

      {/* As tall as its rows, never taller than the space left: no flex-1, so it doesn't grow (no empty space with
          few rows), but it can shrink (flex-shrink: 1) when the rows don't fit, and then the rows scroll */}
      <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
        {searchingFolio ? (
          <FolioResult folio={filters.folio!} query={folioSale} />
        ) : list.isPending ? (
          <LoadingState label="Cargando ventas…" />
        ) : list.isError ? (
          <ErrorState message="No se pudieron cargar las ventas" onRetry={() => list.refetch()} />
        ) : list.data.summary.count === 0 ? (
          hasNarrowingFilters(filters) ? (
            <EmptyState>
              <p>Ninguna venta coincide con los filtros.</p>
              <Button variant="secondary" className="mt-3" onClick={() => handleFiltersChange({ cashierId: null, method: null })}>
                Ver todas las ventas {describePeriod(filters.date)}
              </Button>
            </EmptyState>
          ) : (
            <EmptyState>No hay ventas {describePeriod(filters.date)}.</EmptyState>
          )
        ) : list.data.items.length === 0 ? (
          // A link with page=99, or a page that disappeared
          <EmptyState>
            <p>La página {filters.page} no existe.</p>
            <Button variant="secondary" className="mt-3" onClick={() => goToPage(1)}>Ir a la primera página</Button>
          </EmptyState>
        ) : (
          <>
            {/* Previous results stay visible but dimmed while the new ones load */}
            {/* The only scrolling area. min-h-0 is needed: a flex item can't shrink below its content otherwise.
                The key remounts it on each page or filter change, so the new results start at the top
                instead of keeping the previous scroll position. */}
            <div
              key={JSON.stringify([filters.date, filters.cashierId, filters.method, filters.page])}
              aria-busy={updating}
              className={`min-h-0 overflow-y-auto transition-opacity ${updating ? 'opacity-50' : ''}`}
            >
              <SalesTable sales={list.data.items} />
            </div>
            {list.data.totalPages > 1 && (
              <div className="shrink-0 border-t border-slate-200">
                <Pagination page={list.data.page} totalPages={list.data.totalPages} onPageChange={goToPage} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FolioResult({ folio, query }: { folio: string; query: ReturnType<typeof useSaleByFolio> }) {
  if (query.isPending) return <LoadingState label={`Buscando el folio #${folio}…`} />;
  if (query.isError) {
    if (query.error instanceof ApiRequestError && query.error.status === 404) {
      return <EmptyState>No existe ninguna venta con el folio #{folio}.</EmptyState>;
    }
    return <ErrorState message="No se pudo buscar el folio" onRetry={() => query.refetch()} />;
  }
  return <SalesTable sales={[query.data]} defaultExpandedId={query.data.id} />;
}
