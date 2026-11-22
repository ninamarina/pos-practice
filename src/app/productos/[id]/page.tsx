'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { useCategories } from '@/features/catalog/api';
import { useProduct, useUpdateProduct } from '@/features/products/api';
import { ProductForm } from '@/features/products/components/ProductForm';

export default function EditProductPage({ params }: PageProps<'/productos/[id]'>) {
  const { id } = use(params);
  const router = useRouter();
  const product = useProduct(id);
  const categories = useCategories();
  const updateProduct = useUpdateProduct(id);

  return (
    <div className="mx-auto w-full max-w-xl p-4">
      <h1 className="mb-4 text-xl font-semibold">Editar producto</h1>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        {product.isPending || categories.isPending ? (
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
            onSubmit={input => updateProduct.mutate(input, { onSuccess: () => router.push('/productos') })}
            onCancel={() => router.push('/productos')}
          />
        )}
      </div>
    </div>
  );
}
