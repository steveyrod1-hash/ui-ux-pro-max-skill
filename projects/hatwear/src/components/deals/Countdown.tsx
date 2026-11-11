"use client";

import { dealFor } from "@/lib/deals";
import { useMounted, useNow } from "@/lib/use-now";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}
const pad = (n: number) => String(n).padStart(2, "0");

/** "2d 14h 03m 22s", ticking every second. */
export function Countdown({ endsAt, tone = "light", className = "" }: { endsAt: number; tone?: "light" | "dark"; className?: string }) {
  const now = useNow(1000);
  // Digits only after mount: a ticking clock can never match the server-rendered HTML.
  const mounted = useMounted();
  const t = parts(endsAt - now);
  const box = tone === "dark" ? "bg-white/10 text-white" : "bg-ink text-bone";
  const cells: [string, string][] = [
    [mounted ? String(t.d) : "–", "days"],
    [mounted ? pad(t.h) : "–", "hrs"],
    [mounted ? pad(t.m) : "–", "min"],
    [mounted ? pad(t.s) : "–", "sec"],
  ];
  return (
    <div className={`flex items-center gap-1.5 ${className}`} role="timer" aria-label={`Ends in ${t.d} days ${t.h} hours ${t.m} minutes`}>
      {cells.map(([v, label]) => (
        <span key={label} className={`flex min-w-[3.2rem] flex-col items-center rounded-sm px-2 py-1.5 ${box}`} aria-hidden="true">
          <span className="font-display text-xl font-black leading-none tabular-nums">{v}</span>
          <span className="mt-0.5 text-[0.7rem] uppercase tracking-wide opacity-75">{label}</span>
        </span>
      ))}
    </div>
  );
}

/** Small "Deal ends in…" line for a product page. */
export function DealCountdown({ productId }: { productId: string }) {
  const now = useNow(1000);
  const mounted = useMounted();
  const deal = dealFor(productId, now);
  if (!deal || !mounted) return null;
  const t = parts(deal.ends - now);
  return (
    <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-sign-deep">
      <span className="size-2 rounded-full bg-sign" aria-hidden="true" />
      {deal.label ?? "Limited time"} · ends in {t.d > 0 ? `${t.d}d ` : ""}
      {pad(t.h)}h {pad(t.m)}m {pad(t.s)}s
    </p>
  );
}
