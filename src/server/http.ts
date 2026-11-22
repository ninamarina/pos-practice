import type { ApiError } from '@/types/domain';

const MIN_LATENCY_MS = 200;
const MAX_LATENCY_MS = 700;

// Simulates network + database latency so loading states are visible
export function delay() {
  const ms = MIN_LATENCY_MS + Math.random() * (MAX_LATENCY_MS - MIN_LATENCY_MS);
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Simulates an unreliable backend. Set SALES_FAILURE_RATE=0.3 to fail 30% of the requests
export function shouldFail() {
  const rate = Number(process.env.SALES_FAILURE_RATE ?? 0);
  return Math.random() < rate;
}

export function errorResponse(status: number, code: string, message: string) {
  const body: ApiError = { error: { code, message } };
  return Response.json(body, { status });
}
