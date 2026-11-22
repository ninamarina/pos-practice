import { Badge } from '@/components/ui/Badge';
import { formatMoney } from '@/lib/money';
import type { Product } from '@/types/domain';

type ProductCardProps = {
  product: Product;
  onAdd: (product: Product) => void;
};

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const outOfStock = product.stock <= 0;

  return (
    <button
      type="button"
      onClick={() => onAdd(product)}
      disabled={outOfStock}
      className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-emerald-500 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="line-clamp-2 min-h-10 text-sm font-medium">{product.name}</span>
      <span className="flex items-center justify-between gap-2">
        <span className="font-semibold">{formatMoney(product.price)}</span>
        {outOfStock ? (
          <Badge tone="danger">Agotado</Badge>
        ) : product.stock < 5 ? (
          <Badge tone="warning">Quedan {product.stock}</Badge>
        ) : null}
      </span>
    </button>
  );
}
