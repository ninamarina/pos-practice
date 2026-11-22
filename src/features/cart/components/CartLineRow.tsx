import { formatMoney } from '@/lib/money';
import type { CartLine } from '../useCart';

type CartLineRowProps = {
  line: CartLine;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
};

export function CartLineRow({ line, onQuantityChange, onRemove }: CartLineRowProps) {
  const { product, quantity } = line;

  return (
    <li className="flex items-start gap-3 py-3">
      <div className="flex-1">
        <p className="text-sm font-medium">{product.name}</p>
        <p className="text-xs text-slate-500">{formatMoney(product.price)} c/u</p>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={`Quitar una unidad de ${product.name}`}
          onClick={() => onQuantityChange(quantity - 1)}
          className="size-7 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100"
        >
          −
        </button>
        <span className="w-8 text-center text-sm tabular-nums">{quantity}</span>
        <button
          type="button"
          aria-label={`Agregar una unidad de ${product.name}`}
          onClick={() => onQuantityChange(quantity + 1)}
          className="size-7 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100"
        >
          +
        </button>
      </div>
      <div className="w-24 text-right">
        <p className="text-sm font-semibold tabular-nums">{formatMoney(product.price * quantity)}</p>
        <button type="button" onClick={onRemove} className="text-xs text-red-600 hover:underline">
          Eliminar
        </button>
      </div>
    </li>
  );
}
