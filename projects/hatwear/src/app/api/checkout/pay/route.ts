import { NextResponse } from "next/server";
import { cloverServerConfig } from "@/lib/clover/config";
import { CheckoutError, payForCart, type CartLineInput, type CustomerInput } from "@/lib/clover/checkout";
import { clientIp, rateLimiter } from "@/lib/rate-limit";
import { site } from "@/content/site";

export const runtime = "nodejs";
// Card-testing protection: a handful of payment attempts per visitor.
const limited = rateLimiter(6, 15 * 60_000);

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  if (!cloverServerConfig().checkoutReady) return NextResponse.json({ message: "Online checkout isn't connected yet." }, { status: 503 });
  const ip = clientIp(req);
  if (limited(ip)) return NextResponse.json({ message: `Too many payment attempts. Please wait 15 minutes or call ${site.phone.display}.` }, { status: 429 });

  let body: { lines?: CartLineInput[]; customer?: Partial<CustomerInput>; token?: string; idempotencyKey?: string; website?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "The request could not be read." }, { status: 400 });
  }
  if (body.website) return NextResponse.json({ message: "Payment declined." }, { status: 402 }); // honeypot

  const name = String(body.customer?.name ?? "").trim().slice(0, 100);
  const email = String(body.customer?.email ?? "").trim().slice(0, 200);
  const phone = String(body.customer?.phone ?? "").trim().slice(0, 30);
  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "Enter your name.";
  if (!EMAIL.test(email)) errors.email = "Enter a valid email for your receipt.";
  if (phone.replace(/\D/g, "").length < 10) errors.phone = "Enter a 10-digit phone number so we can tell you it's ready.";
  if (Object.keys(errors).length) return NextResponse.json({ message: "Some details need fixing.", errors }, { status: 422 });
  if (typeof body.token !== "string" || !/^clv_[A-Za-z0-9_-]{6,}$/.test(body.token)) return NextResponse.json({ message: "Card details are missing. Please re-enter your card." }, { status: 400 });
  if (typeof body.idempotencyKey !== "string" || !UUID.test(body.idempotencyKey)) return NextResponse.json({ message: "The request could not be read." }, { status: 400 });

  try {
    const result = await payForCart({ lines: body.lines ?? [], customer: { name, email, phone }, token: body.token, idempotencyKey: body.idempotencyKey, clientIp: ip });
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof CheckoutError) return NextResponse.json({ message: e.message, lineKey: e.lineKey }, { status: e.status });
    console.error("[checkout/pay]", e);
    return NextResponse.json({ message: `Something went wrong and the payment may not have completed. Please call ${site.phone.display} before trying again.` }, { status: 500 });
  }
}
