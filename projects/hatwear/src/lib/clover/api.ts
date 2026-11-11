import "server-only";
import { cloverServerConfig } from "./config";

/** A Clover API failure, with the HTTP status and Clover's own message when available. */
export class CloverError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public declineCode?: string,
  ) {
    super(message);
  }
}

async function request<T>(url: string, init: RequestInit & { token: string; idempotencyKey?: string; clientIp?: string }): Promise<T> {
  const headers: Record<string, string> = {
    accept: "application/json",
    authorization: `Bearer ${init.token}`,
  };
  if (init.body) headers["content-type"] = "application/json";
  if (init.idempotencyKey) headers["idempotency-key"] = init.idempotencyKey;
  if (init.clientIp) headers["x-forwarded-for"] = init.clientIp;

  let res: Response;
  try {
    res = await fetch(url, { method: init.method ?? "GET", body: init.body, headers, cache: "no-store", signal: AbortSignal.timeout(20_000) });
  } catch {
    throw new CloverError("Couldn't reach Clover. Please try again in a moment.", 503);
  }
  const text = await res.text();
  let data: unknown = undefined;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = undefined;
  }
  if (!res.ok) {
    const err = (data as { error?: { message?: string; code?: string; decline_code?: string }; message?: string } | undefined) ?? {};
    throw new CloverError(err.error?.message ?? err.message ?? `Clover returned ${res.status}`, res.status, err.error?.code, err.error?.decline_code);
  }
  return data as T;
}

/** Clover REST (platform) API: inventory and orders. */
export function rest<T>(path: string, init: { method?: string; body?: unknown } = {}) {
  const c = cloverServerConfig();
  return request<T>(`${c.restBase}/v3/merchants/${c.merchantId}${path}`, {
    method: init.method,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    token: c.apiToken,
  });
}

/** Clover Ecommerce API: payments. */
export function ecomm<T>(path: string, init: { method?: string; body?: unknown; idempotencyKey?: string; clientIp?: string } = {}) {
  const c = cloverServerConfig();
  return request<T>(`${c.ecommBase}${path}`, {
    method: init.method,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    token: c.ecommPrivateKey,
    idempotencyKey: init.idempotencyKey,
    clientIp: init.clientIp,
  });
}
