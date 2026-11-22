import { db } from '@/server/db';
import { delay, errorResponse, shouldFail } from '@/server/http';
import type { CreateSaleInput, Sale } from '@/types/domain';

// GET /api/sales: newest first
export async function GET() {
  await delay();
  return Response.json(db.sales);
}

// POST /api/sales: registers a sale and decrements stock
export async function POST(request: Request) {
  await delay();
  if (shouldFail()) return errorResponse(503, 'service_unavailable', 'Servicio no disponible, intenta de nuevo');

  const body = (await request.json().catch(() => null)) as CreateSaleInput | null;
  if (!body || !Array.isArray(body.items) || body.items.length === 0) {
    return errorResponse(400, 'invalid_body', 'La venta debe tener al menos un producto');
  }

  const items = [];
  for (const line of body.items) {
    const product = db.products.find(p => p.id === line.productId);
    if (!product) return errorResponse(422, 'product_not_found', `Producto ${line.productId} no encontrado`);
    items.push({ productId: product.id, name: product.name, unitPrice: line.unitPrice, quantity: line.quantity });
  }

  for (const line of body.items) {
    const product = db.products.find(p => p.id === line.productId)!;
    product.stock -= line.quantity;
  }

  const sale: Sale = {
    id: `sale_${crypto.randomUUID()}`,
    folio: db.nextFolio++,
    createdAt: new Date().toISOString(),
    cashierId: body.cashierId,
    items,
    total: body.total,
    paymentMethod: body.paymentMethod,
    cashReceived: body.cashReceived,
    change: body.cashReceived === null ? null : body.cashReceived - body.total,
  };
  db.sales.unshift(sale);

  return Response.json(sale, { status: 201, headers: { Location: `/api/sales/${sale.id}` } });
}
