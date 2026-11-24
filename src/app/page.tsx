'use client';

import { useState } from 'react';
import { ErrorState, LoadingState, EmptyState } from '@/components/ui/States';
import { Spinner } from '@/components/ui/Spinner';
import { useCategories, useProducts } from '@/features/catalog/api';
import { CategoryTabs } from '@/features/catalog/components/CategoryTabs';
import { ProductGrid } from '@/features/catalog/components/ProductGrid';
import { CartPanel } from '@/features/cart/components/CartPanel';
import { useCart } from '@/features/cart/CartProvider';
import { CheckoutDialog } from '@/features/checkout/components/CheckoutDialog';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import type { Sale } from '@/types/domain';

// How many products the grid shows. A cashier finds a product by searching, not by scrolling thousands of cards
const GRID_LIMIT = 60;

export default function SellPage() {
  const cart = useCart();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const products = useProducts({ q: debouncedSearch, categoryId, limit: GRID_LIMIT });
  const categories = useCategories();
  const [checkingOut, setCheckingOut] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  function handleSaleCompleted(sale: Sale) {
    setCheckingOut(false);
    setLastSale(sale);
    cart.clear();
  }

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_380px]">
      {/* The search and the categories stay fixed; only the product grid scrolls */}
      <section className="flex min-h-0 flex-col" aria-label="Catálogo">
        <div className="flex shrink-0 flex-col gap-4 p-4 pb-2">
          <div className="relative">
            <input
              type="search"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Buscar por nombre o código de barras…"
              aria-label="Buscar producto"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 pr-12"
            />
            {products.isFetching && !products.isPending && (
              <span className="absolute top-1/2 right-4 -translate-y-1/2">
                <Spinner label="Buscando" />
              </span>
            )}
          </div>
          {categories.data && <CategoryTabs categories={categories.data} selectedId={categoryId} onSelect={setCategoryId} />}

          {lastSale && (
            <div role="status" className="flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <span>Venta #{lastSale.folio} registrada</span>
              <button type="button" onClick={() => setLastSale(null)} className="font-medium hover:underline">Cerrar</button>
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 pt-2">
          {products.isPending ? (
            <LoadingState label="Cargando catálogo…" />
          ) : products.isError ? (
            <ErrorState message="No se pudo cargar el catálogo" onRetry={() => products.refetch()} />
          ) : products.data.products.length === 0 ? (
            <EmptyState>No hay productos que coincidan con “{debouncedSearch}”</EmptyState>
          ) : (
            <>
              <ProductGrid products={products.data.products} onAdd={cart.add} />
              {products.data.hasMore && (
                <p className="mt-4 text-center text-sm text-slate-500">
                  Se muestran los primeros {GRID_LIMIT}. Busca por nombre o código de barras para encontrar otros.
                </p>
              )}
            </>
          )}
        </div>
      </section>

      <CartPanel cart={cart} onCheckout={() => setCheckingOut(true)} />

      {checkingOut && <CheckoutDialog onClose={() => setCheckingOut(false)} onSuccess={handleSaleCompleted} />}
    </div>
  );
}
