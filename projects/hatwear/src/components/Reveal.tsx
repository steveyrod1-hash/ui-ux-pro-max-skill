"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/** Image reveal: a clip-path wipe as the element scrolls into view. Runs once. */
export function RevealImage({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ clipPath: "inset(0 0 100% 0)" }}
      whileInView={{ clipPath: "inset(0 0 0% 0)" }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.9, ease: [0.25, 1, 0.5, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

/** Stagger a list of children in as they enter. */
export function Stagger({ children, className, as = "div" }: { children: ReactNode; className?: string; as?: "div" | "ul" }) {
  const C = as === "ul" ? motion.ul : motion.div;
  return (
    <C
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
    >
      {children}
    </C>
  );
}

export const staggerItem = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] as const } },
};

export function StaggerItem({ children, className, as = "div" }: { children: ReactNode; className?: string; as?: "div" | "li" }) {
  const C = as === "li" ? motion.li : motion.div;
  return (
    <C className={className} variants={staggerItem}>
      {children}
    </C>
  );
}
