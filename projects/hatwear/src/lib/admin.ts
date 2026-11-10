import "server-only";
import { timingSafeEqual } from "node:crypto";

/** True when ADMIN_TOKEN is set and the supplied token matches it. */
export async function isAdmin(token: string | null | undefined) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected || !token) return false;
  const a = Buffer.from(token), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
