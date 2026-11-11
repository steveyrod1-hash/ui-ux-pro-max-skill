import Link from "next/link";
import { ArrowIcon } from "./Icons";

/** Eyebrow + big italic title + optional "View all" link, as used across the site. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  action,
  tone = "light",
  children,
}: {
  id: string;
  eyebrow?: string;
  title: React.ReactNode;
  action?: { href: string; label: string };
  tone?: "light" | "dark";
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        {eyebrow && <p className={`eyebrow ${tone === "dark" ? "text-steel" : "text-stone"}`}>{eyebrow}</p>}
        <h2 id={id} className="mt-2 text-[clamp(2.2rem,1.5rem+3vw,3.9rem)] uppercase">
          {title}
        </h2>
        {children}
      </div>
      {action && (
        <Link href={action.href} className={`group inline-flex min-h-11 shrink-0 items-center gap-2 font-semibold ${tone === "dark" ? "text-bone" : "text-ink"}`}>
          {action.label} <ArrowIcon size={20} className="transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
