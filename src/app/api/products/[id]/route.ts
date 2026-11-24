import { requireUser } from '@/server/auth';
import { db } from '@/server/db';
import { delay, errorResponse } from '@/server/http';
import type { UpdateProductInput } from '@/types/domain';

export async function GET(_request: Request, ctx: RouteContext<'/api/products/[id]'>) {
  await delay();
  const { id } = await ctx.params;
  const product = db.products.find(p => p.id === id);
  if (!product) return errorResponse(404, 'product_not_found', 'Producto no encontrado');
  return Response.json(product);
}

// PATCH /api/products/:id { name?, price?, stock?, categoryId? }. Only the owner can edit.
// Only the fields sent are changed, so the client should send just what the user edited
export async function PATCH(request: Request, ctx: RouteContext<'/api/products/[id]'>) {
  await delay();
  const user = requireUser(request, 'owner');
  if (user instanceof Response) return user;

  const { id } = await ctx.params;
  const product = db.products.find(p => p.id === id);
  if (!product) return errorResponse(404, 'product_not_found', 'Producto no encontrado');

  const body = (await request.json().catch(() => null)) as UpdateProductInput | null;
  if (!body) return errorResponse(400, 'invalid_body', 'Cuerpo inválido');

  if (body.name !== undefined && !body.name.trim()) {
    return errorResponse(422, 'invalid_name', 'El nombre es obligatorio');
  }
  if (body.price !== undefined && (!Number.isInteger(body.price) || body.price <= 0)) {
    return errorResponse(422, 'invalid_price', 'El precio debe ser mayor a cero');
  }
  if (body.stock !== undefined && (!Number.isInteger(body.stock) || body.stock < 0)) {
    return errorResponse(422, 'invalid_stock', 'El stock no puede ser negativo');
  }

  Object.assign(product, {
    ...(body.name !== undefined && { name: body.name.trim() }),
    ...(body.price !== undefined && { price: body.price }),
    ...(body.stock !== undefined && { stock: body.stock }),
    ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
  });
  return Response.json(product);
}
