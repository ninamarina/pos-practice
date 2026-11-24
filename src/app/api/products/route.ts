import { db } from '@/server/db';
import { delay } from '@/server/http';

const MAX_LIMIT = 500;

// GET /api/products?q=&categoryId=&lowStock=&limit=
// q matches the name, or the exact barcode or SKU. lowStock=1 returns products with fewer than 5 units.
// limit caps the result: the client asks for one more than it shows to know if there are more
export async function GET(request: Request) {
  await delay();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim().toLowerCase();
  const categoryId = searchParams.get('categoryId');
  const lowStock = searchParams.get('lowStock') === '1';
  const limit = Math.min(Number(searchParams.get('limit')) || MAX_LIMIT, MAX_LIMIT);

  let products = db.products;
  if (categoryId) products = products.filter(p => p.categoryId === categoryId);
  if (lowStock) products = products.filter(p => p.stock < 5);
  if (q) products = products.filter(p => p.name.toLowerCase().includes(q) || p.barcode === q || p.sku.toLowerCase() === q);

  return Response.json(products.slice(0, limit));
}
