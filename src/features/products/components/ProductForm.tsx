'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { parseMoney } from '@/lib/money';
import type { Category, Product, UpdateProductInput } from '@/types/domain';

type ProductFormProps = {
  product: Product;
  categories: Category[];
  submitting: boolean;
  error: string | null;
  onSubmit: (input: UpdateProductInput) => void;
  onCancel: () => void;
};

export function ProductForm({ product, categories, submitting, error, onSubmit, onCancel }: ProductFormProps) {
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState((product.price / 100).toFixed(2));
  const [stock, setStock] = useState(String(product.stock));
  const [categoryId, setCategoryId] = useState(product.categoryId);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit({ name, price: parseMoney(price), stock: Number(stock), categoryId });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Nombre" htmlFor="name">
        <input id="name" value={name} onChange={e => setName(e.target.value)} required className={inputClass} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Precio (MXN, con IVA)" htmlFor="price">
          <input id="price" inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)} required className={inputClass} />
        </Field>
        <Field label="Stock" htmlFor="stock">
          <input id="stock" type="number" min={0} value={stock} onChange={e => setStock(e.target.value)} required className={inputClass} />
        </Field>
      </div>
      <Field label="Categoría" htmlFor="category">
        <select id="category" value={categoryId} onChange={e => setCategoryId(e.target.value)} className={inputClass}>
          {categories.map(category => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </Field>
      <p className="text-xs text-slate-500">SKU {product.sku} · Código de barras {product.barcode}</p>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={submitting}>{submitting ? 'Guardando…' : 'Guardar'}</Button>
      </div>
    </form>
  );
}

const inputClass = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2';

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}
