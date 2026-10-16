"use client";

import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { AudioLines, Captions, Layers, Repeat, Sparkles, Type, ZoomIn } from "lucide-react";
import { cn } from "@/lib/cn";
import { trackLabel, type Track } from "@/lib/mock";
import { springs } from "@/lib/motion";
import { useEditor, useTime } from "./store";

const overlayTracks: Track[] = ["captions", "plates", "zooms", "transitions", "media"];

export const trackColor: Record<Track, string> = {
  video: "var(--track-video)",
  captions: "var(--track-captions)",
  plates: "var(--track-plates)",
  zooms: "var(--track-zooms)",
  transitions: "var(--track-transitions)",
  media: "var(--track-media)",
  music: "var(--track-music)",
};

export const trackIcon: Record<Track, typeof Type> = {
  video: Layers,
  captions: Captions,
  plates: Type,
  zooms: ZoomIn,
  transitions: Repeat,
  media: Sparkles,
  music: AudioLines,
};

/*
 * Таймлайн как в референсе: линейка, цветные клипы-«пилюли» для слоёв,
 * дорожка видео с лентой кадров, дорожка звука с волной.
 */
export function Timeline({
  pps,
  filmstrip,
  wave,
  onOpenBlock,
}: {
  pps: number;
  filmstrip?: string;
  wave?: string;
  onOpenBlock?: () => void;
}) {
  const ed = useEditor();
  const width = ed.duration * pps;
  const scroller = useRef<HTMLDivElement>(null);
  const rows = overlayTracks.filter((t) => ed.blocks.some((b) => b.track === t));

  const clip = (b: (typeof ed.blocks)[number], h: string, children: React.ReactNode, extra?: React.CSSProperties) => {
    const selected = ed.selectedId === b.id;
    const isFresh = ed.fresh.has(b.id);
    return (
      <motion.button
        // смена пресета пересоздаёт клип — так он заново «прилетает» на место
        key={`${b.id}:${b.presetId ?? ""}`}
        layout="position"
        initial={isFresh ? { opacity: 0, y: -18, scale: 0.85 } : false}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={springs.soft}
        onClick={(e) => {
          e.stopPropagation();
          ed.select(selected ? null : b.id);
          if (!selected) onOpenBlock?.();
        }}
        className={cn(
          "absolute top-0 overflow-hidden rounded-md text-left text-[12px] font-medium whitespace-nowrap",
          h,
          selected ? "ring-2 ring-fg ring-offset-2 ring-offset-bg" : "hover:brightness-110",
          isFresh && !selected && "ring-2 ring-accent ring-offset-2 ring-offset-bg",
        )}
        style={{ left: b.start * pps, width: Math.max(8, (b.end - b.start) * pps - 3), ...extra }}
        aria-pressed={selected}
        aria-label={`${trackLabel[b.track]}: ${b.label}`}
      >
        {children}
      </motion.button>
    );
  };

  return (
    <div ref={scroller} className="relative h-full overflow-x-auto overflow-y-auto px-6 pb-3">
      <div className="relative" style={{ width }}>
        <Ruler pps={pps} width={width} />

        <div className="flex flex-col gap-1.5 pt-1">
          {rows.map((tr) => {
            const Icon = trackIcon[tr];
            return (
              <div key={tr} className="relative h-7">
                {ed.blocks
                  .filter((b) => b.track === tr)
                  .map((b) =>
                    clip(
                      b,
                      "h-7",
                      <span className="flex h-full items-center gap-1.5 px-2.5 text-white">
                        {(b.end - b.start) * pps > 36 && <Icon className="size-3.5 shrink-0 opacity-80" />}
                        {(b.end - b.start) * pps > 70 && <span className="truncate">{b.label}</span>}
                      </span>,
                      { background: `color-mix(in oklch, ${trackColor[tr]} 72%, black)` },
                    ),
                  )}
              </div>
            );
          })}

          {/* Видео: лента кадров (1 кадр/с), смещённая под каждый клип */}
          <div className="relative h-[64px]">
            {ed.blocks
              .filter((b) => b.track === "video")
              .map((b) =>
                clip(
                  b,
                  "h-[64px] bg-surface-2",
                  <span className="absolute bottom-1.5 left-2 rounded-xs bg-bg/70 px-1.5 py-0.5 text-[11px] text-fg">{b.label}</span>,
                  filmstrip
                    ? {
                        backgroundImage: `url(${filmstrip})`,
                        backgroundSize: `${ed.duration * pps}px 100%`,
                        backgroundPosition: `${-b.start * pps}px 0`,
                        backgroundRepeat: "no-repeat",
                      }
                    : undefined,
                ),
              )}
          </div>

          {/* Звук: зелёная волна */}
          <div className="relative h-10">
            {ed.blocks
              .filter((b) => b.track === "music")
              .map((b) =>
                clip(
                  b,
                  "h-10 border border-track-music/70",
                  <span className="absolute top-1 left-2 flex items-center gap-1 text-[11px] text-track-music">
                    <AudioLines className="size-3" /> {b.label}
                  </span>,
                  {
                    background: `color-mix(in oklch, var(--track-music) 22%, black)`,
                    ...(wave
                      ? { backgroundImage: `url(${wave})`, backgroundSize: `${ed.duration * pps}px 100%`, backgroundPosition: `${-b.start * pps}px 0`, backgroundRepeat: "no-repeat" }
                      : {}),
                  },
                ),
              )}
          </div>
        </div>

        <Playhead pps={pps} scroller={scroller} />
      </div>
    </div>
  );
}

function Ruler({ pps, width }: { pps: number; width: number }) {
  const ed = useEditor();
  const step = pps < 24 ? 4 : 2;
  const marks = Array.from({ length: Math.floor(ed.duration / step) + 1 }, (_, i) => i * step);
  return (
    <div
      className="relative h-7 cursor-pointer"
      style={{ width }}
      onPointerDown={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        ed.seek((e.clientX - r.left) / pps);
      }}
    >
      {marks.map((s) => (
        <span key={s} className="absolute top-1.5 -translate-x-1/2 font-mono text-[11px] text-fg-subtle tabular-nums" style={{ left: s * pps }}>
          {String(s).padStart(2, "0")}
        </span>
      ))}
      {marks.map((s) => (
        <span key={`d${s}`} className="absolute top-3 size-[3px] -translate-x-1/2 rounded-full bg-fg-subtle/50" style={{ left: (s + step / 2) * pps }} />
      ))}
    </div>
  );
}

function Playhead({ pps, scroller }: { pps: number; scroller: React.RefObject<HTMLDivElement | null> }) {
  const t = useTime();
  const { playing } = useEditor();
  const x = t * pps;

  useEffect(() => {
    const s = scroller.current;
    if (!s || !playing) return;
    if (x > s.scrollLeft + s.clientWidth - 80 || x < s.scrollLeft) s.scrollLeft = x - 80;
  }, [x, playing, scroller]);

  return (
    <div className="pointer-events-none absolute top-0 bottom-0 w-0.5 rounded-full bg-fg" style={{ transform: `translateX(${x - 1}px)` }}>
      <span className="absolute -top-0.5 -left-[5px] h-5 w-3 rounded-full bg-fg" />
    </div>
  );
}
