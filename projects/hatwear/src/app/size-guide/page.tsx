import type { Metadata } from "next";
import Link from "next/link";
import { SizeGuideContent } from "@/components/SizeGuide";

export const metadata: Metadata = {
  title: "Fitted hat size guide",
  description: "How to measure your head and find your fitted hat size, from 6 7/8 to 8, with inches and centimetres.",
  alternates: { canonical: "/size-guide" },
};

export default function SizeGuidePage() {
  return (
    <div className="shell pb-24 pt-10 sm:pt-14">
      <h1 className="text-[clamp(2.8rem,1.6rem+5vw,6rem)] uppercase">Fitted size guide</h1>
      <p className="mt-3 max-w-xl text-lg text-graphite">
        Two minutes with a soft tape saves a return trip. Measure, type it in, and we'll tell you your size.
      </p>
      <div className="stitch my-8 text-ink/40" aria-hidden="true" />
      <SizeGuideContent />
      <Link href="/shop?type=fitted" className="btn btn-dark mt-12">
        Shop fitted hats
      </Link>
    </div>
  );
}
