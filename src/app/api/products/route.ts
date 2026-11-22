import { db } from '@/server/db';
import { delay } from '@/server/http';

// GET /api/products?q=&categoryId=
export async function GET(request: Request) {
  await delay();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim().toLowerCase();
  const categoryId = searchParams.get('categoryId');

  let products = db.products;
  if (categoryId) products = products.filter(p => p.categoryId === categoryId);
  if (q) products = products.filter(p => p.name.toLowerCase().includes(q) || p.barcode === q || p.sku.toLowerCase() === q);

  return Response.json(products);
}
