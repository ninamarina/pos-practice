import { db } from '@/server/db';
import { delay, errorResponse } from '@/server/http';

export async function GET(_request: Request, ctx: RouteContext<'/api/sales/[id]'>) {
  await delay();
  const { id } = await ctx.params;
  const sale = db.sales.find(s => s.id === id);
  if (!sale) return errorResponse(404, 'sale_not_found', 'Venta no encontrada');
  return Response.json(sale);
}
