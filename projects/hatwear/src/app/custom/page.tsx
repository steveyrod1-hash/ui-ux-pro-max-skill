import type { Metadata } from "next";
import Image from "next/image";
import { Studio } from "@/components/custom/Studio";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Custom embroidery studio",
  description: "Design custom embroidery on fitted caps, snapbacks, truckers, dad caps, beanies and bucket hats, preview it live, and request a quote from HatWear in Stockton, CA.",
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
      <section className="shell mt-20" aria-labelledby="made-here">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="made-here" className="text-[clamp(2rem,1.4rem+2.6vw,3.6rem)] uppercase">
            Stitched in the shop
          </h2>
          <p className="max-w-md text-graphite">Every design is stitched right here at HatWear on our Tajima machine, in the Madeira thread colours you pick above.</p>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
          {[
            { src: "/store/tajima-machine.jpg", alt: "The Tajima embroidery machine loaded with Madeira thread", cls: "row-span-2" },
            { src: "/store/thread-wall.jpg", alt: "Madeira thread cones on the shop's thread wall", cls: "" },
            { src: "/store/embroidery-bench.jpg", alt: "Thread cones and stitched backing on the embroidery bench", cls: "" },
          ].map((p) => (
            <div key={p.src} className={`relative min-h-[12rem] overflow-hidden bg-felt md:min-h-[16rem] ${p.cls}`}>
              <Image src={p.src} alt={p.alt} fill sizes="(min-width: 768px) 33vw, 50vw" className="object-cover" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
