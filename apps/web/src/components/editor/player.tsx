"use client";

import { Player as RemotionPlayer, type PlayerRef } from "@remotion/player";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Pause, Play, Sparkles, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/cn";
import { springs } from "@/lib/motion";
import { ShortComposition, outToSrc, outputDuration, srcToOut, type ShortProps } from "@/presets/compositions";
import { FPS, HEIGHT, WIDTH } from "@/presets/registry";
import { cutRanges, fmt, useEditor, useTime } from "./store";


/*
 * Предпросмотр монтажа — Remotion Player с той же композицией, что пойдёт в рендер.
 * Пресеты на таймлайне — те же компоненты, что в библиотеке.
 * Время в сторе — в секундах исходника; вырезанные слова пропускаются композицией.
 */
export function Player({ src, hideTransport }: { src: string; poster: string; hideTransport?: boolean }) {
  const ed = useEditor();
  const player = useRef<PlayerRef>(null);
  const [muted, setMuted] = useState(true);

  const cuts = useMemo(() => cutRanges(ed.words, ed.deleted).map(([a, b]) => [a, b] as [number, number]), [ed.words, ed.deleted]);
  const timedWords = useMemo(() => ed.words.map((w) => ({ text: w.text, start: w.t, end: w.t + w.d, emphasis: w.emphasis })), [ed.words]);
  const durationInFrames = Math.max(1, Math.round(outputDuration(ed.duration, cuts) * FPS));
  const inputProps: ShortProps = useMemo(
    () => ({ src, sourceDuration: ed.duration, cuts, blocks: ed.blocks, words: timedWords }),
    [src, ed.duration, cuts, ed.blocks, timedWords],
  );

  const cutsRef = useRef(cuts);
  cutsRef.current = cuts;

  useEffect(() => {
    const p = player.current;
    if (!p) return;
    const onFrame = (e: { detail: { frame: number } }) => ed.clock.set(outToSrc(e.detail.frame / FPS, cutsRef.current, ed.duration));
    const onPlay = () => ed.setPlaying(true);
    const onPause = () => ed.setPlaying(false);
    p.addEventListener("frameupdate", onFrame);
    p.addEventListener("play", onPlay);
    p.addEventListener("pause", onPause);
    p.addEventListener("ended", onPause);
    ed.registerSeek((t) => {
      p.seekTo(Math.round(srcToOut(t, cutsRef.current) * FPS));
      ed.clock.set(t);
    });
    return () => {
      p.removeEventListener("frameupdate", onFrame);
      p.removeEventListener("play", onPlay);
      p.removeEventListener("pause", onPause);
      p.removeEventListener("ended", onPause);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const p = player.current;
    if (!p) return;
    if (ed.playing && !p.isPlaying()) p.play();
    if (!ed.playing && p.isPlaying()) p.pause();
  }, [ed.playing]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, [contenteditable]")) return;
      if (e.code === "Space") {
        e.preventDefault();
        ed.setPlaying(!ed.playing);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ed]);

  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-3">
      <div className={cn("relative aspect-[9/16] h-full max-h-full max-w-full rounded-md border border-line-strong bg-bg-sunken", ed.directing && "lk-directing")}>
        <div className="absolute inset-0 overflow-hidden rounded-md">
        <RemotionPlayer
          ref={player}
          component={ShortComposition}
          inputProps={inputProps}
          durationInFrames={durationInFrames}
          compositionWidth={WIDTH}
          compositionHeight={HEIGHT}
          fps={FPS}
          initiallyMuted
          clickToPlay
          controls={false}
          acknowledgeRemotionLicense
          style={{ width: "100%", height: "100%" }}
        />
        </div>
        <SafeZone />
        <AnimatePresence>
          {ed.directing && (
            <motion.div
              key="directing"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={springs.ui}
              className="absolute top-3 left-3 flex items-center gap-1.5 rounded-sm bg-bg/80 px-2.5 py-1.5 text-[12px] font-medium"
            >
              <Sparkles className="size-3.5 animate-spin text-accent-hover [animation-duration:2.4s]" /> Claude монтирует…
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => {
            const p = player.current;
            if (!p) return;
            if (muted) p.unmute();
            else p.mute();
            setMuted(!muted);
          }}
          className="press absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-bg/60 text-fg"
          aria-label={muted ? "Включить звук" : "Выключить звук"}
        >
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>
      </div>
      {!hideTransport && <Transport outSeconds={durationInFrames / FPS} />}
    </div>
  );
}

function SafeZone() {
  const { selectedId, blocks } = useEditor();
  const sel = blocks.find((b) => b.id === selectedId);
  if (!sel || (sel.track !== "captions" && sel.track !== "plates")) return null;
  return (
    <div className="pointer-events-none absolute inset-[8%_14%_18%_6%] rounded-md border border-dashed border-fg/40">
      <span className="absolute -top-5 left-0 text-[10px] text-fg/70">Безопасная зона TikTok</span>
    </div>
  );
}

function Transport({ outSeconds }: { outSeconds: number }) {
  const ed = useEditor();
  const t = useTime();
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => ed.setPlaying(!ed.playing)}
        className="press grid size-10 place-items-center rounded-full bg-fg text-bg"
        aria-label={ed.playing ? "Пауза" : "Воспроизвести"}
      >
        {ed.playing ? <Pause className="size-4" fill="currentColor" /> : <Play className="size-4 translate-x-px" fill="currentColor" />}
      </button>
      <span className="min-w-[112px] text-[13px] whitespace-nowrap text-fg-muted tabular-nums">
        <span className="text-fg">{fmt(t)}</span> / {fmt(outSeconds)}
      </span>
    </div>
  );
}
