import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { formatMoney } from '@/lib/money';
import type { Category, Product } from '@/types/domain';

type ProductsTableProps = {
  products: Product[];
  categories: Category[];
  canEdit: boolean;
};

export function ProductsTable({ products, categories, canEdit }: ProductsTableProps) {
  const categoryName = (id: string) => categories.find(c => c.id === id)?.name ?? id;

  return (
    <table className="w-full text-sm">
      <thead className="border-b border-slate-200 text-left text-slate-500">
        <tr>
          <th className="px-4 py-2 font-medium">SKU</th>
          <th className="px-4 py-2 font-medium">Producto</th>
          <th className="px-4 py-2 font-medium">Categoría</th>
          <th className="px-4 py-2 text-right font-medium">Precio</th>
          <th className="px-4 py-2 text-right font-medium">Stock</th>
          {canEdit && <th className="px-4 py-2"><span className="sr-only">Acciones</span></th>}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {products.map(product => (
          <tr key={product.id} className="hover:bg-slate-50">
            <td className="px-4 py-2 font-mono text-xs text-slate-500">{product.sku}</td>
            <td className="px-4 py-2">{product.name}</td>
            <td className="px-4 py-2 text-slate-600">{categoryName(product.categoryId)}</td>
            <td className="px-4 py-2 text-right tabular-nums">{formatMoney(product.price)}</td>
            <td className="px-4 py-2 text-right">
              {product.stock <= 0 ? (
                <Badge tone="danger">{product.stock}</Badge>
              ) : product.stock < 5 ? (
                <Badge tone="warning">{product.stock}</Badge>
              ) : (
                <span className="tabular-nums">{product.stock}</span>
              )}
            </td>
            {canEdit && (
              <td className="px-4 py-2 text-right">
                <Link href={`/productos/${product.id}`} className="text-emerald-700 hover:underline">Editar</Link>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
