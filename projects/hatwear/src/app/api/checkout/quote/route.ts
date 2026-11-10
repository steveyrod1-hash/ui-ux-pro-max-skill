import { NextResponse } from "next/server";
import { cloverServerConfig } from "@/lib/clover/config";
import { CheckoutError, quote, type CartLineInput } from "@/lib/clover/checkout";
import { clientIp, rateLimiter } from "@/lib/rate-limit";

export const runtime = "nodejs";
const limited = rateLimiter(60, 10 * 60_000);

/** Live price, stock and tax check for the bag, straight from Clover. */
export async function POST(req: Request) {
  if (!cloverServerConfig().checkoutReady) return NextResponse.json({ message: "Online checkout isn't connected yet." }, { status: 503 });
  if (limited(clientIp(req))) return NextResponse.json({ message: "Too many requests. Please wait a moment." }, { status: 429 });
  try {
    const body = (await req.json()) as { lines?: CartLineInput[] };
    return NextResponse.json(await quote(body.lines ?? []));
  } catch (e) {
    if (e instanceof CheckoutError) return NextResponse.json({ message: e.message, lineKey: e.lineKey }, { status: e.status });
    console.error("[checkout/quote]", e);
    return NextResponse.json({ message: "We couldn't check prices with the store right now. Please try again." }, { status: 502 });
  }
}
