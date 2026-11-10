"use client";

import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import type { Product } from "@/data/types";
import { ProductArt } from "../ProductArt";
import { ArrowIcon } from "../Icons";

const ease = [0.25, 1, 0.5, 1] as const;

function Line({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <span className="block overflow-hidden pb-[0.04em]">
      <motion.span className="block" initial={{ y: "105%" }} animate={{ y: 0 }} transition={{ duration: 0.9, ease, delay }}>
        {children}
      </motion.span>
    </span>
  );
}

export function HeroWall({ wall }: { wall: { product: Product; colorIndex: number }[] }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const wallY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -60]);

  return (
    <section ref={ref} className="twill relative overflow-hidden bg-ink text-bone" aria-labelledby="hero-title">
      <div className="shell grid items-center gap-10 pb-14 pt-10 lg:min-h-[calc(100dvh-7rem)] lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:py-16">
        <div className="relative z-10">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.6 }} className="text-[0.95rem] text-bone/70">
            Sports hats, beanies, streetwear and custom embroidery · Stockton, CA
          </motion.p>
          <h1 id="hero-title" className="mt-4 font-display text-[clamp(4.2rem,1.6rem+11vw,10.5rem)] font-black uppercase leading-[0.82] tracking-[-0.01em]">
            <Line delay={0.15}>More than</Line>
            <Line delay={0.27}>
              a hat<span className="text-red">.</span>
            </Line>
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6, ease }}
            className="mt-6 max-w-md text-[1.15rem] leading-relaxed text-bone/85"
          >
            Find your fit. Rep your team. Make it yours.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.68, duration: 0.6, ease }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Link href="/shop" className="btn btn-primary group">
              Shop headwear <ArrowIcon size={20} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/custom" className="btn btn-ghost btn-ghost-light">
              Custom embroidery
            </Link>
          </motion.div>
        </div>

        <motion.div style={{ y: wallY }} className="relative" aria-label="A wall of HatWear caps" role="img">
          <div className="grid grid-cols-3 gap-x-3 gap-y-1 sm:gap-x-5">
            {wall.map(({ product, colorIndex }, i) => {
              const row = Math.floor(i / 3);
              const c = product.colorways[colorIndex] ?? product.colorways[0];
              return (
                <div key={`${product.id}-${i}`} className="relative">
                  <motion.div
                    initial={{ opacity: 0, y: -28, rotate: i % 2 ? 2 : -2 }}
                    animate={{ opacity: 1, y: 0, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.35 + row * 0.12 + (i % 3) * 0.07 }}
                  >
                    <Link href={`/product/${product.slug}?color=${c.id}`} tabIndex={-1} aria-hidden="true" className="block transition-transform duration-300 hover:-translate-y-1.5">
                      <ProductArt type={product.type} colors={c.art} mark={product.mark} className="w-full" />
                    </Link>
                  </motion.div>
                  {/* Shelf: a stitched peg rail under each row */}
                  {i % 3 === 0 && (
                    <motion.div
                      className="pointer-events-none absolute -bottom-0.5 left-0 h-[3px] w-[calc(300%+1.5rem)] origin-left bg-bone/15 sm:w-[calc(300%+2.5rem)]"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.8, ease, delay: 0.25 + row * 0.12 }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-right text-xs text-bone/60">Illustrations · store photography coming soon</p>
        </motion.div>
      </div>
      <div className="stitch text-bone/35" aria-hidden="true" />
    </section>
  );
}
