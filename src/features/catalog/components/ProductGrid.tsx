import type { Product } from '@/types/domain';
import { ProductCard } from './ProductCard';

type ProductGridProps = {
  products: Product[];
  onAdd: (product: Product) => void;
};

export function ProductGrid({ products, onAdd }: ProductGridProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
      {products.map(product => (
        <ProductCard key={product.id} product={product} onAdd={onAdd} />
      ))}
    </div>
  );
}
