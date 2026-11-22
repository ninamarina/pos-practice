import { useState } from 'react';
import type { Product } from '@/types/domain';

export type CartLine = {
  product: Product;
  quantity: number;
};

export function useCart() {
  const [lines, setLines] = useState<CartLine[]>([]);

  function add(product: Product) {
    setLines(current => {
      const existing = current.find(line => line.product.id === product.id);
      if (existing) {
        return current.map(line => (line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line));
      }
      return [...current, { product, quantity: 1 }];
    });
  }

  function setQuantity(productId: string, quantity: number) {
    setLines(current =>
      quantity <= 0
        ? current.filter(line => line.product.id !== productId)
        : current.map(line => (line.product.id === productId ? { ...line, quantity } : line)),
    );
  }

  function remove(productId: string) {
    setLines(current => current.filter(line => line.product.id !== productId));
  }

  function clear() {
    setLines([]);
  }

  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const total = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);

  return { lines, itemCount, total, add, setQuantity, remove, clear };
}

export type Cart = ReturnType<typeof useCart>;
