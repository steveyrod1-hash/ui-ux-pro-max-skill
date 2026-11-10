"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { StoreProvider } from "@/lib/store";

/** Motion follows the visitor's reduced-motion setting everywhere. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ type: "spring", stiffness: 380, damping: 34 }}>
      <StoreProvider>{children}</StoreProvider>
    </MotionConfig>
  );
}
