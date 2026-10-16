"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { projects } from "@/lib/mock";
import { springs } from "@/lib/motion";

const items = projects.filter((p) => p.aspect === "9:16");

/*
 * Витрина «что получается»: три вертикальных ролика веером, центральный играет,
 * каждые 3.6 с колода сдвигается. Играет только одно видео и только пока сцена на экране.
 */
export function Showcase() {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!root.current) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.3 });
    io.observe(root.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduce || !visible) return;
    const t = setInterval(() => setI((v) => (v + 1) % items.length), 3600);
    return () => clearInterval(t);
  }, [reduce, visible]);

  const at = (k: number) => items[(i + k + items.length) % items.length];
  const slots = [
    { k: -1, x: -92, rotate: -9, scale: 0.84, z: 1, opacity: 0.55 },
    { k: 1, x: 92, rotate: 9, scale: 0.84, z: 1, opacity: 0.55 },
    { k: 0, x: 0, rotate: 0, scale: 1, z: 2, opacity: 1 },
  ];

  return (
    <div ref={root} className="relative h-full w-[300px]" aria-hidden>
      <AnimatePresence initial={false}>
        {slots.map((s) => {
          const p = at(s.k);
          return (
            <motion.div
              key={`${p.id}-${s.k}`}
              className="absolute top-1/2 left-1/2 h-[82%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg bg-surface-2 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.8)] ring-1 ring-line-strong"
              style={{ aspectRatio: "9 / 16", zIndex: s.z }}
              initial={{ opacity: 0, x: s.x + (s.k >= 0 ? 60 : -60), rotate: s.rotate, scale: s.scale * 0.9 }}
              animate={{ opacity: s.opacity, x: s.x, rotate: s.rotate, scale: s.scale }}
              exit={{ opacity: 0, scale: s.scale * 0.92 }}
              transition={springs.soft}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.poster} alt="" className="absolute inset-0 size-full object-cover" />
              {s.k === 0 && visible && !reduce && (
                <video src={p.preview} muted autoPlay loop playsInline className="absolute inset-0 size-full object-cover" />
              )}
              {s.k === 0 && (
                <span className="absolute bottom-2 left-2 rounded-xs bg-bg/75 px-2 py-1 text-[11px] font-medium">{p.style}</span>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
