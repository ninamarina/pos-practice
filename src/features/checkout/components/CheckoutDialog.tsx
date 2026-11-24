'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { useCart } from '@/features/cart/CartProvider';
import { api, ApiRequestError } from '@/lib/api-client';
import { formatMoney, parseMoney } from '@/lib/money';
import type { PaymentMethod, Product, Sale } from '@/types/domain';
import { useCreateSale } from '../api';

type CheckoutDialogProps = {
  onClose: () => void;
  onSuccess: (sale: Sale) => void;
};

export function CheckoutDialog({ onClose, onSuccess }: CheckoutDialogProps) {
  const cart = useCart();
  const queryClient = useQueryClient();
  const createSale = useCreateSale();
  // One key per checkout attempt: created when the dialog opens and reused by every retry.
  // If the first request did register the sale but the response was lost, the retry gets that same sale back
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashInput, setCashInput] = useState('');
  const [priceChanges, setPriceChanges] = useState<string | null>(null);

  const total = cart.total;
  const cashReceived = paymentMethod === 'cash' ? parseMoney(cashInput) : null;
  const change = cashReceived !== null && !Number.isNaN(cashReceived) ? cashReceived - total : null;
  const canConfirm = paymentMethod === 'card' || (change !== null && change >= 0);
  const pending = createSale.isPending;

  function confirm() {
    setPriceChanges(null);
    createSale.mutate(
      {
        idempotencyKey,
        input: {
          items: cart.lines.map(line => ({ productId: line.productId, quantity: line.quantity })),
          expectedTotal: total,
          paymentMethod,
          cashReceived,
        },
      },
      {
        onSuccess: ({ sale }) => onSuccess(sale),
        onError: error => {
          if (!(error instanceof ApiRequestError)) return;
          if (error.code === 'price_changed') refreshPrices();
          // The catalog shows stale stock: refresh it so the cashier sees what's left
          if (error.code === 'out_of_stock') queryClient.invalidateQueries({ queryKey: ['products'] });
        },
      },
    );
  }

  // Prices changed since the products were added: show the current ones and let the cashier confirm the new total
  async function refreshPrices() {
    let products: Product[];
    try {
      products = await Promise.all(cart.lines.map(line => api<Product>(`/api/products/${line.productId}`)));
    } catch {
      return; // The price_changed error stays on screen; confirming again retries the whole thing
    }
    const changed = cart.updatePrices(products);
    setPriceChanges(changed.map(c => `${c.name}: de ${formatMoney(c.before)} a ${formatMoney(c.after)}`).join(' · '));
    // The total is different now, so this is a new sale for the server
    setIdempotencyKey(crypto.randomUUID());
    queryClient.invalidateQueries({ queryKey: ['products'] });
  }

  // A 409 means the request was understood but can't go through as is: retrying the same request won't help
  const isConflict = createSale.error instanceof ApiRequestError && createSale.error.status === 409;

  return (
    <Dialog
      title="Cobrar"
      onClose={onClose}
      dismissible={!pending}
      closeOnOutsideClick={false}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>Cancelar</Button>
          <Button onClick={confirm} disabled={!canConfirm || pending} aria-busy={pending}>
            {pending ? 'Registrando…' : createSale.isError && !isConflict ? 'Reintentar' : 'Confirmar venta'}
          </Button>
        </>
      }
    >
      <p className="text-3xl font-bold tabular-nums">{formatMoney(total)}</p>

      {/* While the sale is being sent, nothing in the form can change */}
      <fieldset disabled={pending} className="mt-6">
        <legend className="text-sm font-medium text-slate-700">Método de pago</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(['cash', 'card'] as const).map(method => (
            <label
              key={method}
              className={`cursor-pointer rounded-lg border px-4 py-3 text-center text-sm font-medium has-focus-visible:ring-2 has-focus-visible:ring-emerald-500 ${
                paymentMethod === method ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method}
                checked={paymentMethod === method}
                onChange={() => setPaymentMethod(method)}
                className="sr-only"
              />
              {method === 'cash' ? 'Efectivo' : 'Tarjeta'}
            </label>
          ))}
        </div>

        {paymentMethod === 'cash' && (
          <div className="mt-4">
            <label htmlFor="cash" className="text-sm font-medium text-slate-700">Recibido</label>
            <input
              id="cash"
              inputMode="decimal"
              autoFocus
              data-autofocus
              value={cashInput}
              onChange={event => setCashInput(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter' && canConfirm && !pending) confirm();
              }}
              placeholder="0.00"
              aria-describedby="cash-change"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-lg tabular-nums"
            />
            <p id="cash-change" aria-live="polite" className={`mt-2 min-h-5 text-sm ${change !== null && change < 0 ? 'text-red-600' : 'text-slate-700'}`}>
              {change === null ? '' : change < 0 ? `Faltan ${formatMoney(-change)}` : `Cambio: ${formatMoney(change)}`}
            </p>
          </div>
        )}
      </fieldset>

      {paymentMethod === 'card' && (
        <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          Cobra {formatMoney(total)} en la terminal y confirma cuando el pago sea aprobado.
        </p>
      )}

      {priceChanges ? (
        <p role="alert" className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          Cambiaron algunos precios ({priceChanges}). Revisa el nuevo total antes de confirmar.
        </p>
      ) : createSale.isError && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          No se pudo registrar la venta: {createSale.error.message}.
          {!isConflict && ' Puedes reintentar: la venta no se va a duplicar.'}
        </p>
      )}
    </Dialog>
  );
}
