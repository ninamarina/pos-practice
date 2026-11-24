'use client';

import { useState } from 'react';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useCategories, useProducts } from '@/features/catalog/api';
import { ProductsTable } from '@/features/products/components/ProductsTable';
import { useSession } from '@/features/session/SessionProvider';

const TABLE_LIMIT = 100;

export default function ProductsPage() {
  const { user } = useSession();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const products = useProducts({ q: debouncedSearch, lowStock: onlyLowStock, limit: TABLE_LIMIT });
  const categories = useCategories();

  return (
    <div className="mx-auto w-full max-w-6xl p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Productos</h1>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={onlyLowStock} onChange={e => setOnlyLowStock(e.target.checked)} />
            Solo stock bajo
          </label>
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar…"
            aria-label="Buscar producto"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
          />
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {products.isPending || categories.isPending ? (
          <LoadingState label="Cargando productos…" />
        ) : products.isError || categories.isError ? (
          <ErrorState message="No se pudieron cargar los productos" onRetry={() => products.refetch()} />
        ) : products.data.products.length === 0 ? (
          <EmptyState>No hay productos que coincidan</EmptyState>
        ) : (
          <ProductsTable products={products.data.products} categories={categories.data} canEdit={user.role === 'owner'} />
        )}
      </div>
      {products.data?.hasMore && (
        <p className="mt-3 text-center text-sm text-slate-500">
          Se muestran los primeros {TABLE_LIMIT}. Busca por nombre, SKU o código de barras para encontrar otros.
        </p>
      )}
    </div>
  );
}
