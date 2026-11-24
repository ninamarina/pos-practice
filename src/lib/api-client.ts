import type { ApiError } from '@/types/domain';

export class ApiRequestError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

// Demo auth: the SessionProvider sets the selected user, and every request sends it in X-User-Id.
// With real auth this would be a session cookie, and this module wouldn't need to know the user
let currentUserId: string | null = null;

export function setCurrentUserId(id: string | null) {
  currentUserId = id;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(currentUserId && { 'X-User-Id': currentUserId }),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiError | null;
    throw new ApiRequestError(response.status, body?.error.code ?? 'unknown', body?.error.message ?? 'Error inesperado');
  }
  return response.json() as Promise<T>;
}
