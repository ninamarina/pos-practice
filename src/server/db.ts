import type { CreateSaleResult, Product, Sale } from '@/types/domain';
import { createProducts, createSales } from './seed';

// In-memory "database". Lives on globalThis so it survives hot reloads in development
type Db = {
  products: Product[];
  sales: Sale[];
  nextFolio: number;
  // Idempotency-Key → the response of the sale it created
  salesByIdempotencyKey: Map<string, CreateSaleResult>;
};

const globalDb = globalThis as unknown as { posDb?: Db };

export const db: Db = (globalDb.posDb ??= (() => {
  const products = createProducts();
  const sales = createSales(products);
  return { products, sales, nextFolio: 1000 + sales.length, salesByIdempotencyKey: new Map() };
})());

// A db created by an older version of this file (kept alive by hot reload) doesn't have the map yet
db.salesByIdempotencyKey ??= new Map();
