import Link from "next/link";
import { embroideryPricing, site } from "@/content/site";
import { formatTime, money } from "@/lib/format";
import { ClockIcon, NeedleIcon, StoreIcon } from "../Icons";

/** Three true, checkable facts about the store under the hero. */
export function FeatureStrip() {
  const days = Object.values(site.weeklyHours);
  const opens = [...new Set(days.map(([o]) => o))];
  const hoursLine =
    days.length === 7 && opens.length === 1 ? { title: "Open 7 days", sub: `From ${formatTime(opens[0])} daily` } : { title: "Store hours", sub: "See the week's hours" };

  const items = [
    { icon: StoreIcon, title: "Visit the shop", sub: `${site.locatedIn} · ${site.address.city}, ${site.address.region}`, href: "/store" },
    {
      icon: NeedleIcon,
      title: "Custom embroidery",
      sub: embroideryPricing.advertisedFrom ? `From ${money(embroideryPricing.advertisedFrom)}` : "Quoted per request",
      href: "/custom",
    },
    { icon: ClockIcon, title: hoursLine.title, sub: hoursLine.sub, href: "/store#hours" },
  ];

  return (
    <section aria-label="Store highlights" className="border-t border-white/8 bg-charcoal text-bone">
      <ul className="shell grid divide-y divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {items.map(({ icon: Icon, title, sub, href }) => (
          <li key={title}>
            <Link href={href} className="group flex items-center gap-4 py-4 sm:justify-center sm:px-4 sm:py-6 lg:py-7">
              <Icon size={34} className="shrink-0 text-bone transition-transform duration-300 group-hover:-translate-y-0.5" strokeWidth={1.5} />
              <span className="min-w-0">
                <span className="block font-display text-[0.95rem] font-extrabold uppercase tracking-[0.04em] [font-variation-settings:'wdth'_112]">{title}</span>
                <span className="block text-[0.92rem] text-steel transition-colors group-hover:text-bone">{sub}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
