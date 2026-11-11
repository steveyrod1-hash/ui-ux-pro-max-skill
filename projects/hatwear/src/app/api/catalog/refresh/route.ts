import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";

export const runtime = "nodejs";

/**
 * Rebuilds the site so product pages pick up the latest Clover prices and stock.
 * Called daily by Vercel Cron (vercel.json) and on demand by the owner:
 *   /api/catalog/refresh?token=ADMIN_TOKEN
 * Needs VERCEL_DEPLOY_HOOK_URL (Vercel → Project → Settings → Git → Deploy Hooks).
 * Checkout always re-checks Clover live, so stale pages can never oversell.
 */
async function trigger(req: Request) {
  const fromCron = !!process.env.CRON_SECRET && req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
  if (!fromCron && !(await isAdmin(new URL(req.url).searchParams.get("token")))) return new NextResponse("Not found", { status: 404 });
  const hook = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (!hook) return NextResponse.json({ ok: false, message: "VERCEL_DEPLOY_HOOK_URL is not set." }, { status: 503 });
  const res = await fetch(hook, { method: "POST", signal: AbortSignal.timeout(10_000) }).catch(() => null);
  if (!res?.ok) return NextResponse.json({ ok: false, message: "Vercel didn't accept the rebuild request." }, { status: 502 });
  return NextResponse.json({ ok: true, message: "Rebuild started. The site updates in about two minutes." });
}

export const GET = trigger;
export const POST = trigger;
