import { USERS } from '@/server/seed';

export async function GET() {
  return Response.json(USERS);
}
