import type { Metadata } from "next";
import { Studio } from "@/components/custom/Studio";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Custom embroidery studio",
  description: "Design custom embroidery on hats, beanies, hoodies and windbreakers, preview it live, and request a quote from HatWear in Stockton, CA.",
  alternates: { canonical: "/custom" },
};

export default async function CustomPage({ searchParams }: { searchParams: Promise<{ base?: string; color?: string }> }) {
  const { base, color } = await searchParams;
  return (
    <div className="pb-24">
      <section className="twill bg-ink text-bone">
        <div className="shell grid gap-6 py-12 sm:py-16 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <h1 className="text-[clamp(3.4rem,1.6rem+8vw,9rem)] uppercase leading-[0.84]">
            Your hat.
            <br />
            Your mark.
          </h1>
          <p className="max-w-md text-lg text-bone/80">
            Embroidery starts at $7.99. Design it here, see an approximate preview, and send it to the store. HatWear replies with an exact quote and timing. Nothing is made or charged until you say yes. Questions? Call{" "}
            <a href={`tel:${site.phone.tel}`} className="link font-semibold text-white">
              {site.phone.display}
            </a>
            .
          </p>
        </div>
      </section>
      <div className="shell pt-10 sm:pt-14">
        <Studio key={`${base}-${color}`} initialBase={base} initialColor={color} />
      </div>
    </div>
  );
}
