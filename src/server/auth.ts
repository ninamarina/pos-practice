import type { Role, User } from '@/types/domain';
import { errorResponse } from './http';
import { USERS } from './seed';

// Stand-in for real authentication: the client sends the selected demo user in X-User-Id.
// In production this would come from a session cookie or a token verified by the server
export function currentUser(request: Request): User | null {
  const id = request.headers.get('X-User-Id');
  return USERS.find(user => user.id === id) ?? null;
}

// Returns the user, or an error response to send back (401 without a user, 403 without the role)
export function requireUser(request: Request, role?: Role): User | Response {
  const user = currentUser(request);
  if (!user) return errorResponse(401, 'unauthenticated', 'Inicia sesión para continuar');
  if (role && user.role !== role) return errorResponse(403, 'forbidden', 'No tienes permiso para hacer esto');
  return user;
}
