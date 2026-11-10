"use client";

import { useEffect, useState } from "react";
import { site } from "@/content/site";
import { formatTime as to12 } from "@/lib/format";

/** "Open now · until 7 PM" in Stockton time. Rendered after mount so it never mismatches the server. */
export function OpenNow({ className = "" }: { className?: string }) {
  const [label, setLabel] = useState<{ open: boolean; text: string } | null>(null);

  useEffect(() => {
    const compute = () => {
      const parts = new Intl.DateTimeFormat("en-US", { timeZone: site.timeZone, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
      const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
      const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
      const mins = (Number(get("hour")) % 24) * 60 + Number(get("minute"));
      const m = (t: string) => Number(t.split(":")[0]) * 60 + Number(t.split(":")[1]);
      const [o, c] = site.weeklyHours[day];
      if (mins >= m(o) && mins < m(c)) return setLabel({ open: true, text: `Open now · until ${to12(c)}` });
      const next = mins < m(o) ? `today at ${to12(o)}` : `tomorrow at ${to12(site.weeklyHours[(day + 1) % 7][0])}`;
      setLabel({ open: false, text: `Closed · opens ${next}` });
    };
    compute();
    const t = setInterval(compute, 60_000);
    return () => clearInterval(t);
  }, []);

  if (!label) return <span className={`inline-block h-6 ${className}`} aria-hidden="true" />;
  return (
    <span className={`inline-flex items-center gap-2 font-semibold ${className}`}>
      <span className={`size-2.5 rounded-full ${label.open ? "bg-ok" : "bg-sign"}`} aria-hidden="true" />
      {label.text}
    </span>
  );
}
