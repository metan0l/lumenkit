"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedLogo } from "./animated-logo";

const KEY = "lumenkit:preloaded";

/*
 * Фирменный прелоадер. Рендерится уже в серверном HTML, поэтому закрывает экран
 * с первого кадра; знак собирается на CSS ещё до гидрации. Уходит, когда готовы
 * шрифты и прошло минимум 1.1 с (на повторных заходах в сессии — 0.35 с).
 * Уход — «пролёт сквозь знак»: знак увеличивается, экран растворяется.
 */
export function Preloader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(KEY) === "1";
      sessionStorage.setItem(KEY, "1");
    } catch {}
    const minDelay = new Promise((r) => setTimeout(r, seen ? 350 : 1100));
    const fonts = typeof document !== "undefined" && document.fonts ? document.fonts.ready : Promise.resolve();
    let cancelled = false;
    Promise.all([minDelay, fonts]).then(() => {
      if (cancelled) return;
      setVisible(false);
      (window as Window & { __lkReady?: boolean }).__lkReady = true;
      window.dispatchEvent(new Event("lumenkit:ready"));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="preloader"
          role="status"
          aria-label="Загружаем Lumen Kit"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-7 bg-bg"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.65, 0, 0.35, 1], delay: 0.1 }}
        >
          <motion.div initial={{ scale: 1 }} exit={{ scale: 1.6, opacity: 0 }} transition={{ duration: 0.5, ease: [0.65, 0, 0.35, 1] }}>
            <AnimatedLogo className="size-20" />
          </motion.div>
          <motion.div className="lk-fade-up flex flex-col items-center gap-5" exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.2 }}>
            <span className="text-[22px] font-semibold tracking-[-0.035em]">
              lumen<span className="text-fg-muted">kit</span>
            </span>
            <span className="relative block h-[3px] w-28 overflow-hidden rounded-full bg-surface-3">
              <span className="lk-bar absolute inset-y-0 left-0 w-full rounded-full bg-accent" />
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
