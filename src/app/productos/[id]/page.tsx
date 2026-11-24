'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { useCategories } from '@/features/catalog/api';
import { useProduct, useUpdateProduct } from '@/features/products/api';
import { ProductForm } from '@/features/products/components/ProductForm';
import { useSession } from '@/features/session/SessionProvider';

export default function EditProductPage({ params }: PageProps<'/productos/[id]'>) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useSession();
  const product = useProduct(id);
  const categories = useCategories();
  const updateProduct = useUpdateProduct(id);

  return (
    <div className="mx-auto w-full max-w-xl p-4">
      <h1 className="mb-4 text-xl font-semibold">Editar producto</h1>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        {/* Hiding this page from cashiers is only UX: the API rejects their changes with a 403 */}
        {user.role !== 'owner' ? (
          <ErrorState message="Solo la dueña puede editar productos." />
        ) : product.isPending || categories.isPending ? (
          <LoadingState />
        ) : product.isError || categories.isError ? (
          <ErrorState message="No se pudo cargar el producto" onRetry={() => product.refetch()} />
        ) : (
          <ProductForm
            key={product.data.id}
            product={product.data}
            categories={categories.data}
            submitting={updateProduct.isPending}
            error={updateProduct.error?.message ?? null}
            onSubmit={input => {
              // Nothing changed: no need for a request
              if (Object.keys(input).length === 0) return router.push('/productos');
              updateProduct.mutate(input, { onSuccess: () => router.push('/productos') });
            }}
            onCancel={() => router.push('/productos')}
          />
        )}
      </div>
    </div>
  );
}
