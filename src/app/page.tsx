'use client';

import { useState } from 'react';
import { ErrorState, LoadingState, EmptyState } from '@/components/ui/States';
import { useCategories, useProducts } from '@/features/catalog/api';
import { CategoryTabs } from '@/features/catalog/components/CategoryTabs';
import { ProductGrid } from '@/features/catalog/components/ProductGrid';
import { CartPanel } from '@/features/cart/components/CartPanel';
import { useCart } from '@/features/cart/useCart';
import { CheckoutDialog } from '@/features/checkout/components/CheckoutDialog';
import type { Sale } from '@/types/domain';

export default function SellPage() {
  const products = useProducts();
  const categories = useCategories();
  const cart = useCart();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  const visibleProducts = (products.data ?? []).filter(product => {
    const matchesCategory = !categoryId || product.categoryId === categoryId;
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  function handleSaleCompleted(sale: Sale) {
    setCheckingOut(false);
    setLastSale(sale);
    cart.clear();
  }

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_380px]">
      <section className="flex flex-col gap-4 overflow-y-auto p-4" aria-label="Catálogo">
        <input
          type="search"
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="Buscar producto…"
          aria-label="Buscar producto"
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5"
        />
        {categories.data && <CategoryTabs categories={categories.data} selectedId={categoryId} onSelect={setCategoryId} />}

        {lastSale && (
          <div role="status" className="flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <span>Venta #{lastSale.folio} registrada</span>
            <button type="button" onClick={() => setLastSale(null)} className="font-medium hover:underline">Cerrar</button>
          </div>
        )}

        {products.isPending ? (
          <LoadingState label="Cargando catálogo…" />
        ) : products.isError ? (
          <ErrorState message="No se pudo cargar el catálogo" onRetry={() => products.refetch()} />
        ) : visibleProducts.length === 0 ? (
          <EmptyState>No hay productos que coincidan con “{search}”</EmptyState>
        ) : (
          <ProductGrid products={visibleProducts} onAdd={cart.add} />
        )}
      </section>

      <CartPanel cart={cart} onCheckout={() => setCheckingOut(true)} />

      {checkingOut && (
        <CheckoutDialog lines={cart.lines} total={cart.total} onClose={() => setCheckingOut(false)} onSuccess={handleSaleCompleted} />
      )}
    </div>
  );
}
