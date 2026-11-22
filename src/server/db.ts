import type { Product, Sale } from '@/types/domain';
import { createProducts, createSales } from './seed';

// In-memory "database". Lives on globalThis so it survives hot reloads in development
type Db = { products: Product[]; sales: Sale[]; nextFolio: number };

const globalDb = globalThis as unknown as { posDb?: Db };

export const db: Db = (globalDb.posDb ??= (() => {
  const products = createProducts();
  const sales = createSales(products);
  return { products, sales, nextFolio: 1000 + sales.length };
})());
