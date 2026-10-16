"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Clapperboard, ImageIcon, Loader2, RefreshCw, Wand2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { genResults, type GenSpec } from "@/lib/mock";
import { modelById } from "@lumenkit/core";
import { springs } from "@/lib/motion";
import { useToast } from "@/components/ui/toast";
import { useEditor } from "./store";

/*
 * Генерация внутри ответа режиссёра. Пользователь видит не «крутилку», а работу:
 * какой шаг идёт, какая модель, сколько попыток — и результат проявляется из размытия.
 * Готовое Claude сам ставит на дорожку «AI-вставки».
 */

const stepsFor = (gen: GenSpec, model: string) =>
  gen.kind === "image"
    ? [
        { label: gen.ref ? "Изучаю ваше фото" : "Пишу промпт для модели", ms: 900 },
        { label: `Рисую · ${model} · попытка 1 из 3`, ms: 1800 },
        { label: "Проверяю кадр: свет, композиция, текст", ms: 1100 },
      ]
    : [
        { label: gen.ref ? "Беру ваше фото как кадр-референс" : "Готовлю кадр-референс", ms: 1500 },
        { label: `Анимирую · ${model}`, ms: 5200 },
        { label: "Проверяю движение", ms: 900 },
      ];

const tone = {
  image: { chip: "bg-gen-image-soft text-gen-image", bar: "bg-gen-image", glow: "var(--gen-image-soft)", icon: ImageIcon },
  video: { chip: "bg-gen-video-soft text-gen-video", bar: "bg-gen-video", glow: "var(--gen-video-soft)", icon: Clapperboard },
};

const fmt = (t: number) => `00:${String(Math.floor(t)).padStart(2, "0")}`;

export function GenCard({ gen, index }: { gen: GenSpec; index: number }) {
  const ed = useEditor();
  const toast = useToast();
  const model = modelById(gen.model);
  const modelLabel = model?.label ?? gen.model;
  const price = model?.cost ?? 0;
  const plan = useMemo(() => stepsFor(gen, modelLabel), [gen, modelLabel]);
  const blockId = `gen-${gen.id}`;
  const existing = ed.blocks.find((b) => b.id === blockId);
  // Уже на таймлайне (вкладку переключили и вернулись) — показываем результат, а не генерируем заново
  const [step, setStep] = useState(existing ? plan.length : 0);
  const [progress, setProgress] = useState(0);
  const done = step >= plan.length;
  const variants = gen.kind === "image" ? [genResults.image[index % 4], genResults.image[(index + 1) % 4]] : [];
  const [pick, setPick] = useState(() => Math.max(0, variants.indexOf(String(existing?.params?.src ?? ""))));
  const placed = useRef(!!existing);
  const t = tone[gen.kind];

  // Шаги генерации (в прототипе — по таймеру)
  useEffect(() => {
    if (done) return;
    const id = setTimeout(() => setStep((s) => s + 1), plan[step].ms);
    return () => clearTimeout(id);
  }, [step, done, plan]);

  // Прогресс Seedance — честная полоса, а не бесконечная крутилка
  useEffect(() => {
    if (gen.kind !== "video" || step !== 1) return;
    const started = performance.now();
    const id = setInterval(() => setProgress(Math.min(100, ((performance.now() - started) / plan[1].ms) * 100)), 120);
    return () => clearInterval(id);
  }, [gen.kind, step, plan]);

  const src = gen.kind === "image" ? variants[pick] : genResults.video.src;

  // Готово — ставим на таймлайн один раз
  useEffect(() => {
    if (!done || placed.current) return;
    placed.current = true;
    if (ed.blocks.some((b) => b.id === blockId)) return;
    ed.commit((s) => ({
      ...s,
      blocks: [
        ...s.blocks,
        { id: blockId, track: "media", start: gen.at, end: gen.at + gen.len, label: gen.prompt, presetId: "ai-media", params: { src, kind: gen.kind } },
      ],
    }));
  }, [done, ed, blockId, gen, src]);

  const choose = (i: number) => {
    setPick(i);
    ed.patch((s) => ({ ...s, blocks: s.blocks.map((b) => (b.id === blockId ? { ...b, params: { ...b.params, src: variants[i] } } : b)) }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springs.soft, delay: index * 0.08 }}
      className="overflow-hidden rounded-md bg-surface-2"
    >
      {/* Шапка: модель, кто решил, промпт */}
      <div className="flex items-start gap-2.5 p-2.5">
        <span className={cn("grid size-8 shrink-0 place-items-center rounded-sm", t.chip)}>
          <t.icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[13px] font-medium">
            {modelLabel}
            {gen.auto && (
              <span className="flex items-center gap-1 rounded-full bg-accent-soft px-1.5 py-px text-[11px] text-accent-hover">
                <Wand2 className="size-3" /> Claude выбрал
              </span>
            )}
            <span className="t-meta ml-auto t-num">+{price} кр.</span>
          </div>
          <p className="t-meta mt-0.5 line-clamp-2" title={gen.prompt}>
            {gen.auto && <span className="text-fg-muted">Промпт от Claude: </span>}
            {gen.prompt}
          </p>
        </div>
        {gen.ref && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={gen.ref} alt="Референс" title="Ваше фото — референс" className="size-9 shrink-0 rounded-sm object-cover ring-1 ring-line-strong" />
        )}
      </div>

      {/* Сцена генерации */}
      <div className="relative mx-2.5 overflow-hidden rounded-sm bg-bg-sunken">
        {gen.kind === "image" ? (
          <div className="grid grid-cols-2 gap-1.5">
            {variants.map((v, i) => (
              <button
                key={v}
                disabled={!done}
                onClick={() => choose(i)}
                aria-label={`Вариант ${i + 1}${pick === i ? ", выбран" : ""}`}
                className={cn("relative aspect-[3/4] overflow-hidden rounded-sm", done && "press")}
              >
                <Pending show={!done} glow={t.glow} delay={i * 0.4} />
                <AnimatePresence>
                  {done && (
                    <motion.img
                      src={v}
                      alt=""
                      initial={{ opacity: 0, filter: "blur(18px)", scale: 1.1 }}
                      animate={{ opacity: pick === i ? 1 : 0.55, filter: "blur(0px)", scale: 1 }}
                      transition={{ ...springs.soft, delay: i * 0.12 }}
                      className="absolute inset-0 size-full object-cover"
                    />
                  )}
                </AnimatePresence>
                {done && pick === i && (
                  <motion.span
                    layoutId={`pick-${gen.id}`}
                    transition={springs.layout}
                    className="absolute inset-0 rounded-sm ring-2 ring-gen-image ring-inset"
                  >
                    <span className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-full bg-bg/80 px-2 py-0.5 text-[11px] font-medium backdrop-blur">
                      <Check className="size-3 text-gen-image" strokeWidth={3} /> {i === 0 ? "Claude выбрал" : "Ваш выбор"}
                    </span>
                  </motion.span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="relative aspect-video">
            <Pending show={step < 1} glow={t.glow} />
            {/* Кадр-референс от Nano Banana, затем — оживший ролик */}
            {step >= 1 && !done && (
              <motion.img
                src={gen.ref ?? genResults.video.poster}
                alt=""
                initial={{ opacity: 0, filter: "blur(16px)" }}
                animate={{ opacity: 0.8, filter: "blur(0px)", scale: [1, 1.06] }}
                transition={{ opacity: springs.soft, filter: springs.soft, scale: { duration: plan[1].ms / 1000, ease: "linear" } }}
                className="absolute inset-0 size-full object-cover"
              />
            )}
            {step >= 1 && !done && <div className="lk-sheen absolute inset-0 overflow-hidden" />}
            {done && (
              <motion.video
                src={genResults.video.src}
                autoPlay
                muted
                loop
                playsInline
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={springs.soft}
                className="absolute inset-0 size-full object-cover"
              />
            )}
            {done && (
              <span className="absolute top-1.5 left-1.5 rounded-full bg-bg/80 px-2 py-0.5 text-[11px] font-medium backdrop-blur">5 сек · 720p</span>
            )}
          </div>
        )}
      </div>

      {/* Подвал: шаг или итог */}
      <div className="flex min-h-11 items-center gap-2 px-2.5 py-2" aria-live="polite">
        {!done ? (
          <>
            <Loader2 className="size-3.5 shrink-0 animate-spin text-fg-subtle" />
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={step}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={springs.ui}
                className="t-meta min-w-0 flex-1 truncate"
              >
                {plan[step].label}
              </motion.span>
            </AnimatePresence>
            {gen.kind === "video" && step === 1 && (
              <span className="flex w-20 items-center gap-1.5">
                <span className="h-1 flex-1 overflow-hidden rounded-full bg-surface-3">
                  <span className={cn("block h-full origin-left rounded-full", t.bar)} style={{ transform: `scaleX(${progress / 100})` }} />
                </span>
                <span className="t-num text-[11px] text-fg-subtle">{Math.round(progress)}%</span>
              </span>
            )}
          </>
        ) : (
          <>
            <button onClick={() => ed.seek(gen.at)} className="press t-meta flex-1 text-left hover:text-fg">
              Поставил на <span className="t-num text-fg">{fmt(gen.at)}</span> · {gen.len} сек
            </button>
            <button
              onClick={() => toast({ text: `Ещё вариант · ${modelLabel}: списано ${price} кр.` })}
              className="press flex h-8 items-center gap-1.5 rounded-sm px-2.5 text-[12px] text-fg-muted hover:bg-surface-3 hover:text-fg"
            >
              <RefreshCw className="size-3.5" /> Ещё
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

/** Пока модель работает: мягкое цветное «облако» и бегущий блик */
function Pending({ show, glow, delay = 0 }: { show: boolean; glow: string; delay?: number }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={springs.ui} className="lk-sheen absolute inset-0 overflow-hidden bg-surface">
          <div
            className="lk-drift-a absolute -inset-1/4 rounded-full"
            style={{ background: `radial-gradient(closest-side, ${glow}, transparent)`, animationDelay: `${-delay * 4}s` }}
          />
          <div
            className="lk-drift-b absolute -inset-1/3 rounded-full opacity-70"
            style={{ background: `radial-gradient(closest-side, var(--glow-a), transparent)`, animationDelay: `${-delay * 3}s` }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
