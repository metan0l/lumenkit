"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

// Живой индикатор очереди (в продукте — SSE). Здесь прогресс тикает на моках.
export function useMockProgress(start: number, step = 1, every = 900) {
  const [p, setP] = useState(start);
  useEffect(() => {
    const t = setInterval(() => setP((v) => (v >= 99 ? start : v + step)), every);
    return () => clearInterval(t);
  }, [start, step, every]);
  return p;
}

export function QueueIndicator({ collapsed }: { collapsed: boolean }) {
  const p = useMockProgress(64);
  return (
    <Link
      href="/projects/bmw-v-tumane"
      className={cn("block rounded-sm px-2.5 py-2 hover:bg-surface", collapsed && "grid place-items-center px-0")}
      title={collapsed ? `Рендер: ${p}%` : undefined}
    >
      {collapsed ? (
        <Ring value={p} />
      ) : (
        <>
          <div className="flex items-center gap-2.5">
            <span className="pulse-dot shrink-0" />
            <span className="min-w-0 flex-1 truncate text-[13px] text-fg-muted">BMW в тумане</span>
            <span className="font-mono text-[12px] tabular-nums text-fg">{p}%</span>
          </div>
        </>
      )}
    </Link>
  );
}

export function Ring({ value, size = 22 }: { value: number; size?: number }) {
  const r = (size - 4) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth="2.5" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value / 100)}
        style={{ transition: "stroke-dashoffset 700ms var(--ease-out)" }}
      />
    </svg>
  );
}
