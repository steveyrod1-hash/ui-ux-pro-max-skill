"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { site } from "@/content/site";
import { ArrowIcon, PinIcon } from "../Icons";
import { HeroCap } from "./HeroCap";

const ease = [0.25, 1, 0.5, 1] as const;

function Line({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <span className="block overflow-hidden pb-[0.06em] pr-[0.08em]">
      <motion.span className="block" initial={{ y: "105%" }} animate={{ y: 0 }} transition={{ duration: 0.9, ease, delay }}>
        {children}
      </motion.span>
    </span>
  );
}

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const artY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -50]);
  const photo = site.heroPhoto;

  return (
    <section ref={ref} className="navy-stage relative isolate overflow-hidden text-bone" aria-labelledby="hero-title">
      {/* Oversized brand letters behind the drawn cap (the photo brings its own backdrop) */}
      {!photo && (
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.2, ease, delay: 0.1 }}
        className="pointer-events-none absolute right-[-6%] top-[34%] -z-10 select-none font-display text-[clamp(15rem,62vw,22rem)] font-black italic leading-[0.8] tracking-[-0.07em] hw-backdrop [font-variation-settings:'wdth'_125] md:right-[-3%] md:top-[4%] md:text-[clamp(18rem,40vw,40rem)]"
      >
        HW
      </motion.div>
      )}

      <div className="shell grid gap-x-6 pb-10 pt-8 [grid-template-areas:'copy'_'art'_'actions'] sm:pt-12 md:min-h-[38rem] md:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)] md:grid-rows-[1fr_1fr] md:py-14 md:[grid-template-areas:'copy_art'_'actions_art'] lg:min-h-[min(48rem,calc(100svh-7.5rem))] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:py-16 2xl:min-h-[50rem]">
        <div className="relative z-10 [grid-area:copy] md:self-end">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.6 }} className="eyebrow text-steel">
            Sports hats, beanies, streetwear <span className="whitespace-nowrap">&amp; custom embroidery</span>
          </motion.p>
          <h1
            id="hero-title"
            className="mt-4 font-display text-[clamp(3rem,17vw,5.2rem)] font-black uppercase leading-[0.84] tracking-[-0.035em] text-white md:text-[clamp(4.1rem,8.4vw,7.4rem)] lg:mt-5 lg:text-[clamp(5.6rem,7.6vw,8.6rem)]"
          >
            <Line delay={0.15}>More</Line>
            <Line delay={0.25}>than</Line>
            <Line delay={0.35}>a hat.</Line>
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6, ease }}
            className="mt-5 max-w-md text-[1.08rem] leading-relaxed text-bone/85 sm:text-[1.2rem] lg:mt-7"
          >
            Find your fit. Rep your team. Make it yours.
          </motion.p>
        </div>

        <motion.div
          style={{ y: artY }}
          className={`relative -mx-[4%] mt-2 [grid-area:art] md:mx-0 md:-mr-[6%] md:mt-0 md:self-center lg:mr-0`}
        >
          <motion.div initial={{ opacity: 0, y: 36, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 1.1, ease, delay: 0.25 }}>
            {photo ? (
              <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} priority sizes="(min-width: 768px) 55vw, 100vw" className="h-auto w-full [mask-image:radial-gradient(ellipse_52%_56%_at_52%_60%,#000_46%,rgba(0,0,0,.55)_68%,transparent_92%)] [-webkit-mask-image:radial-gradient(ellipse_52%_56%_at_52%_60%,#000_46%,rgba(0,0,0,.55)_68%,transparent_92%)]" />
            ) : (
              <HeroCap className="h-auto w-full" />
            )}
          </motion.div>
          {!photo && <p className="absolute bottom-1 right-[5%] text-[0.7rem] text-steel/80">Illustration</p>}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.68, duration: 0.6, ease }}
          className="relative z-10 mt-6 [grid-area:actions] md:mt-9 md:self-start"
        >
          <div className="flex flex-col gap-3 md:max-w-[22rem]">
            <Link href="/shop" className="btn btn-primary btn-lg group w-full">
              Shop headwear <ArrowIcon size={20} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/custom" className="btn btn-ghost btn-ghost-light btn-lg w-full">
              Custom embroidery
            </Link>
          </div>
          <Link href="/store" className="eyebrow mt-6 inline-flex min-h-11 items-center gap-2 text-bone/85 transition-colors hover:text-white">
            <PinIcon size={18} /> {site.address.city}, {site.address.region}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
