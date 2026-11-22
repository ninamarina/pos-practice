import { db } from '@/server/db';
import { delay, errorResponse } from '@/server/http';

// GET /api/sales/by-folio/:folio: a folio identifies one sale, so this is a lookup, not a filter.
// It ignores dates, cashier and payment method on purpose.
export async function GET(_request: Request, ctx: RouteContext<'/api/sales/by-folio/[folio]'>) {
  await delay();
  const { folio } = await ctx.params;
  if (!/^\d+$/.test(folio)) return errorResponse(400, 'invalid_folio', 'El folio debe ser un número');

  const sale = db.sales.find(s => s.folio === Number(folio));
  if (!sale) return errorResponse(404, 'sale_not_found', `No existe la venta con folio ${folio}`);
  return Response.json(sale);
}
