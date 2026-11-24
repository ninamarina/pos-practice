'use client';

import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import type { Product } from '@/types/domain';

// The ticket lives above the routes, so it survives navigating to Ventas, and in localStorage, so it survives a reload.
// It's local to this register: there's no need to keep it on the server

// unitPrice is the price shown when the product was added. The server prices the sale and answers
// 409 price_changed if it no longer matches, and then updatePrices refreshes it
export type CartLine = {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
};

const STORAGE_KEY = 'pos.cart';

function useCartState() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Read the saved ticket after mounting: localStorage doesn't exist while rendering on the server
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from an external store once on mount
      if (saved) setLines(JSON.parse(saved) as CartLine[]);
    } catch {
      // Unavailable or corrupted storage: start with an empty ticket
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Storage full or blocked: the ticket still works, it just won't survive a reload
    }
  }, [lines, loaded]);

  function add(product: Product) {
    setLines(current => {
      const existing = current.find(line => line.productId === product.id);
      if (existing) {
        return current.map(line => (line.productId === product.id ? { ...line, quantity: line.quantity + 1 } : line));
      }
      return [...current, { productId: product.id, name: product.name, unitPrice: product.price, quantity: 1 }];
    });
  }

  function setQuantity(productId: string, quantity: number) {
    setLines(current =>
      quantity <= 0
        ? current.filter(line => line.productId !== productId)
        : current.map(line => (line.productId === productId ? { ...line, quantity } : line)),
    );
  }

  function remove(productId: string) {
    setLines(current => current.filter(line => line.productId !== productId));
  }

  function clear() {
    setLines([]);
  }

  // Applies the current prices and returns the lines whose price changed, so the UI can tell the cashier
  function updatePrices(products: Product[]) {
    const priceOf = (productId: string) => products.find(p => p.id === productId)?.price;
    const changed = lines
      .filter(line => priceOf(line.productId) !== undefined && priceOf(line.productId) !== line.unitPrice)
      .map(line => ({ name: line.name, before: line.unitPrice, after: priceOf(line.productId)! }));
    setLines(current => current.map(line => ({ ...line, unitPrice: priceOf(line.productId) ?? line.unitPrice })));
    return changed;
  }

  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const total = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

  return { lines, itemCount, total, add, setQuantity, remove, clear, updatePrices };
}

export type Cart = ReturnType<typeof useCartState>;

const CartContext = createContext<Cart | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const cart = useCartState();
  return <CartContext value={cart}>{children}</CartContext>;
}

export function useCart() {
  const cart = use(CartContext);
  if (!cart) throw new Error('useCart must be used inside <CartProvider>');
  return cart;
}
