"use client";

import { MotionConfig } from "motion/react";
import { springs } from "@/lib/motion";
import { ToastProvider } from "@/components/ui/toast";
import { Preloader } from "@/components/brand/preloader";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={springs.ui}>
      <ToastProvider>{children}</ToastProvider>
      <Preloader />
    </MotionConfig>
  );
}
