import { delay } from '@/server/http';
import { CATEGORIES } from '@/server/seed';

export async function GET() {
  await delay();
  return Response.json(CATEGORIES);
}
