import { Button } from '@/components/ui/Button';
import { formatMoney } from '@/lib/money';
import type { Cart } from '../useCart';
import { CartLineRow } from './CartLineRow';

type CartPanelProps = {
  cart: Cart;
  onCheckout: () => void;
};

export function CartPanel({ cart, onCheckout }: CartPanelProps) {
  return (
    <aside className="flex min-h-0 flex-col border-l border-slate-200 bg-white" aria-label="Ticket actual">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="font-semibold">Ticket</h2>
        {cart.lines.length > 0 && (
          <button type="button" onClick={cart.clear} className="text-sm text-slate-500 hover:text-red-600">
            Vaciar
          </button>
        )}
      </div>

      {cart.lines.length === 0 ? (
        <p className="flex flex-1 items-center justify-center p-6 text-center text-sm text-slate-500">
          Agrega productos tocándolos en el catálogo
        </p>
      ) : (
        <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto px-4">
          {cart.lines.map(line => (
            <CartLineRow
              key={line.product.id}
              line={line}
              onQuantityChange={quantity => cart.setQuantity(line.product.id, quantity)}
              onRemove={() => cart.remove(line.product.id)}
            />
          ))}
        </ul>
      )}

      <div className="space-y-3 border-t border-slate-200 p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-slate-600">Total ({cart.itemCount} {cart.itemCount === 1 ? 'artículo' : 'artículos'})</span>
          <span className="text-2xl font-bold tabular-nums">{formatMoney(cart.total)}</span>
        </div>
        <Button className="w-full py-3 text-base" disabled={cart.lines.length === 0} onClick={onCheckout}>
          Cobrar
        </Button>
      </div>
    </aside>
  );
}
