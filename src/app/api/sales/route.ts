import { requireUser } from '@/server/auth';
import { db } from '@/server/db';
import { delay, errorResponse, shouldFail } from '@/server/http';
import { STORE_TIME_ZONE } from '@/lib/store-config';
import { parseSalesQuery, querySales } from '@/server/sales-query';
import type { CreateSaleInput, CreateSaleResult, Sale } from '@/types/domain';

// GET /api/sales?range=today|yesterday|week|month  or  ?from=YYYY-MM-DD&to=YYYY-MM-DD
//   &cashierId=&method=cash|card&page=1&pageSize=20&asOf=<ISO timestamp>
// Newest first, paginated. The summary covers the whole filtered set, not just the page.
export async function GET(request: Request) {
  await delay();
  const params = new URL(request.url).searchParams;
  const parsed = parseSalesQuery(params, STORE_TIME_ZONE, new Date());
  if (!parsed.ok) return errorResponse(400, 'invalid_query', parsed.message);
  return Response.json(querySales(db.sales, parsed.query, STORE_TIME_ZONE));
}

// POST /api/sales: registers a sale and decrements stock.
// Send an Idempotency-Key header: retrying with the same key returns the original sale instead of creating another
export async function POST(request: Request) {
  await delay();

  const user = requireUser(request);
  if (user instanceof Response) return user;

  const idempotencyKey = request.headers.get('Idempotency-Key');
  if (!idempotencyKey) return errorResponse(400, 'missing_idempotency_key', 'Falta el header Idempotency-Key');
  const previous = db.salesByIdempotencyKey.get(idempotencyKey);
  if (previous) return Response.json(previous, { status: 201, headers: { Location: `/api/sales/${previous.sale.id}` } });

  if (shouldFail()) return errorResponse(503, 'service_unavailable', 'Servicio no disponible, intenta de nuevo');

  const body = (await request.json().catch(() => null)) as CreateSaleInput | null;
  if (!body || !Array.isArray(body.items) || body.items.length === 0) {
    return errorResponse(400, 'invalid_body', 'La venta debe tener al menos un producto');
  }

  // Prices come from the catalog, never from the client
  const lines = [];
  for (const line of body.items) {
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
      return errorResponse(422, 'invalid_quantity', 'La cantidad debe ser un entero mayor a cero');
    }
    const product = db.products.find(p => p.id === line.productId);
    if (!product) return errorResponse(422, 'product_not_found', `Producto ${line.productId} no encontrado`);
    lines.push({ product, quantity: line.quantity });
  }

  // Check every line before touching the stock, so a sale is applied whole or not at all.
  // The handler runs without awaiting in between, so no other sale can interleave (like a transaction in a real DB)
  const short = lines.find(({ product, quantity }) => product.stock < quantity);
  if (short) {
    return errorResponse(409, 'out_of_stock', `No hay stock suficiente de ${short.product.name} (quedan ${short.product.stock})`);
  }

  const total = lines.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0);
  if (total !== body.expectedTotal) {
    return errorResponse(409, 'price_changed', 'Cambiaron los precios de algunos productos del ticket');
  }

  const cashReceived = body.paymentMethod === 'cash' ? body.cashReceived : null;
  if (body.paymentMethod === 'cash' && (cashReceived === null || cashReceived < total)) {
    return errorResponse(422, 'insufficient_cash', 'El efectivo recibido no alcanza para el total');
  }

  for (const { product, quantity } of lines) product.stock -= quantity;

  const sale: Sale = {
    id: `sale_${crypto.randomUUID()}`,
    folio: db.nextFolio++,
    createdAt: new Date().toISOString(),
    cashierId: user.id,
    items: lines.map(({ product, quantity }) => ({ productId: product.id, name: product.name, unitPrice: product.price, quantity })),
    total,
    paymentMethod: body.paymentMethod,
    cashReceived,
    change: cashReceived === null ? null : cashReceived - total,
  };
  db.sales.unshift(sale);

  const result: CreateSaleResult = {
    sale,
    stock: Object.fromEntries(lines.map(({ product }) => [product.id, product.stock])),
  };
  db.salesByIdempotencyKey.set(idempotencyKey, result);

  return Response.json(result, { status: 201, headers: { Location: `/api/sales/${sale.id}` } });
}
