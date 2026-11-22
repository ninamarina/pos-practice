'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/features/session/SessionProvider';
import { formatMoney, parseMoney } from '@/lib/money';
import type { PaymentMethod, Sale } from '@/types/domain';
import type { CartLine } from '@/features/cart/useCart';
import { useCreateSale } from '../api';

type CheckoutDialogProps = {
  lines: CartLine[];
  total: number;
  onClose: () => void;
  onSuccess: (sale: Sale) => void;
};

export function CheckoutDialog({ lines, total, onClose, onSuccess }: CheckoutDialogProps) {
  const { user } = useSession();
  const createSale = useCreateSale();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashInput, setCashInput] = useState('');

  const cashReceived = paymentMethod === 'cash' ? parseMoney(cashInput) : null;
  const change = cashReceived !== null && !Number.isNaN(cashReceived) ? cashReceived - total : null;
  const canConfirm = paymentMethod === 'card' || (change !== null && change >= 0);

  function confirm() {
    createSale.mutate(
      {
        cashierId: user.id,
        items: lines.map(line => ({ productId: line.product.id, quantity: line.quantity, unitPrice: line.product.price })),
        total,
        paymentMethod,
        cashReceived,
      },
      { onSuccess },
    );
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-900/40 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="checkout-title" className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 id="checkout-title" className="text-lg font-semibold">Cobrar</h2>
        <p className="mt-1 text-3xl font-bold tabular-nums">{formatMoney(total)}</p>

        <fieldset className="mt-6">
          <legend className="text-sm font-medium text-slate-700">Método de pago</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(['cash', 'card'] as const).map(method => (
              <label
                key={method}
                className={`cursor-pointer rounded-lg border px-4 py-3 text-center text-sm font-medium ${
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
        </fieldset>

        {paymentMethod === 'cash' && (
          <div className="mt-4">
            <label htmlFor="cash" className="text-sm font-medium text-slate-700">Recibido</label>
            <input
              id="cash"
              inputMode="decimal"
              autoFocus
              value={cashInput}
              onChange={event => setCashInput(event.target.value)}
              placeholder="0.00"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-lg tabular-nums"
            />
            {change !== null && (
              <p className={`mt-2 text-sm ${change < 0 ? 'text-red-600' : 'text-slate-700'}`}>
                {change < 0 ? `Faltan ${formatMoney(-change)}` : `Cambio: ${formatMoney(change)}`}
              </p>
            )}
          </div>
        )}

        {paymentMethod === 'card' && (
          <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            Cobra {formatMoney(total)} en la terminal y confirma cuando el pago sea aprobado.
          </p>
        )}

        {createSale.isError && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            No se pudo registrar la venta: {createSale.error.message}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={confirm} disabled={!canConfirm}>
            {createSale.isPending ? 'Registrando…' : 'Confirmar venta'}
          </Button>
        </div>
      </div>
    </div>
  );
}
