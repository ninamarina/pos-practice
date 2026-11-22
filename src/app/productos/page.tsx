'use client';

import { useState } from 'react';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { useCategories, useProducts } from '@/features/catalog/api';
import { ProductsTable } from '@/features/products/components/ProductsTable';
import { useSession } from '@/features/session/SessionProvider';

export default function ProductsPage() {
  const { user } = useSession();
  const products = useProducts();
  const categories = useCategories();
  const [search, setSearch] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  const visible = (products.data ?? []).filter(
    product =>
      product.name.toLowerCase().includes(search.toLowerCase()) && (!onlyLowStock || product.stock < 5),
  );

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
        ) : visible.length === 0 ? (
          <EmptyState>No hay productos que coincidan</EmptyState>
        ) : (
          <ProductsTable products={visible} categories={categories.data} canEdit={user.role === 'owner'} />
        )}
      </div>
    </div>
  );
}
