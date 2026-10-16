"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { CircleAlert, Download, RefreshCw, Shuffle } from "lucide-react";
import { cn } from "@/lib/cn";
import { costs, insertJobs, type InsertJob } from "@/lib/mock";
import { genCost } from "@/lib/prompt-tokens";
import { springs } from "@/lib/motion";
import { usePreviewPlay } from "@/lib/use-preview-play";
import { Composer } from "@/components/composer";
import { PresetMedia } from "@/components/preset-media";
import { ErrorState } from "@/components/ui/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useMockProgress } from "@/components/shell/queue-indicator";

export function InsertsView() {
  const [jobs, setJobs] = useState<InsertJob[]>(insertJobs);
  const [text, setText] = useState("");
  const [alpha, setAlpha] = useState(true);
  const toast = useToast();

  const submit = () => {
    if (!text.trim()) return;
    const job: InsertJob = {
      id: `n${Date.now()}`,
      prompt: text.trim(),
      status: "queued",
      format: alpha ? "WebM" : "MP4",
      alpha,
      duration: 5,
      presetId: "imya",
      cost: costs.insert + genCost(text),
    };
    setJobs((j) => [job, ...j]);
    setText("");
    toast({ text: `Вставка в очереди · списано ${job.cost} кр.` });
    setTimeout(() => setJobs((j) => j.map((x) => (x.id === job.id ? { ...x, status: "generating", progress: 8 } : x))), 1200);
    setTimeout(() => setJobs((j) => j.map((x) => (x.id === job.id ? { ...x, status: "ready" } : x))), 6000);
  };

  const cost = costs.insert;
  const ready = jobs.filter((j) => j.status === "ready").length;
  const active = jobs.filter((j) => j.status === "queued" || j.status === "generating").length;

  return (
    <div className="mx-auto max-w-[1100px] px-4 md:px-10">
      {/* Сцена как на главной: заголовок + живой пример, промпт наезжает снизу */}
      <section className="pt-4 md:pt-2">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={springs.soft} className="panel-stage relative rounded-2xl p-4 pb-20 md:p-6 md:pb-24">
          <div className="relative flex min-h-[240px] items-center overflow-hidden rounded-xl bg-bg-sunken px-6 py-8 md:h-[300px] md:px-12">
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="lk-drift-a absolute top-[-35%] left-[5%] size-[70%] rounded-full bg-[radial-gradient(closest-side,var(--glow-a),transparent)]" />
              <div className="lk-drift-b absolute right-[0%] bottom-[-40%] size-[60%] rounded-full bg-[radial-gradient(closest-side,var(--glow-b),transparent)]" />
            </div>
            <div className="relative flex w-full items-center justify-between gap-10">
              <div className="max-w-[420px]">
                <h1 className="t-display">Какая вставка нужна?</h1>
                <p className="t-body mt-3 max-w-[42ch]">
                  Опишите моушен-элемент — получите клип с прозрачным фоном, который ложится в любой монтаж.
                </p>
                <div className="t-meta mt-5 flex flex-wrap gap-x-4 gap-y-1">
                  <span>MP4 · WebM · ProRes 4444</span>
                  <span>до 10 сек</span>
                  <span>60 к/с</span>
                </div>
              </div>
              <div className="hidden w-[300px] shrink-0 overflow-hidden rounded-lg ring-1 ring-line-strong md:block">
                <PresetMedia presetId="podpishis" playing className="aspect-video [&>div]:!h-full" />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springs.soft, delay: 0.08 }} className="relative z-10 mx-3 -mt-16 md:mx-10 md:-mt-20">
          <Composer
            value={text}
            onChange={setText}
            attached={[]}
            onAttach={() => {}}
            onDetach={() => {}}
            onSubmit={submit}
            cost={cost}
            allowVideo={false}
            placeholder="Например: плашка «подпишись» с иконкой YouTube, выезжает справа, белая"
            chips={examples.map((e) => ({ label: e.label, text: e.text, onClick: () => setText(e.text) }))}
            extras={
              <>
                <Toggle on={alpha} onClick={() => setAlpha((v) => !v)}>
                  Прозрачный фон
                </Toggle>
              </>
            }
          />
        </motion.div>
      </section>

      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springs.soft, delay: 0.16 }} className="mt-14 pb-12">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="t-heading">Мои вставки</h2>
          <span className="t-meta t-num">
            {ready} готово{active ? ` · ${active} в работе` : ""}
          </span>
        </div>
        <div className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {jobs.map((j) => (
              <motion.div
                key={j.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={springs.ui}
              >
                <JobRow job={j} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.section>
    </div>
  );
}

const examples = [
  { label: "BMW из тумана · Seedance", text: "BMW выезжает из тумана {seedance-2.5: чёрная BMW M4 в лесном тумане, фары, медленный наезд}" },
  { label: "Фон GPT Image 2 и плашка", text: "Фон {gpt-image-2: неоновый гараж ночью, надпись GARAGE} и поверх {Имя и роль}" },
  { label: "Плашка «Подписаться»", text: "{Подписаться}, курсор нажимает, прозрачный фон" },
  { label: "Счётчик до 100 000", text: "Счётчик подписчиков 0 → 100 000, крупные цифры" },
];

function Toggle({ on, onClick, title, children }: { on: boolean; onClick: () => void; title?: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-pressed={on}
      className={cn(
        "press flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium",
        on ? "bg-accent-soft text-accent-hover" : "bg-surface-2 text-fg-muted hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}

function JobRow({ job }: { job: InsertJob }) {
  const { ref, playing, bind } = usePreviewPlay<HTMLDivElement>();
  const video = useRef<HTMLVideoElement>(null);
  const progress = useMockProgress(job.progress ?? 0, 2, 400);
  const toast = useToast();

  useEffect(() => {
    const v = video.current;
    if (!v || !job.preview) return;
    if (playing) {
      if (!v.src) v.src = job.preview;
      v.play().catch(() => {});
    } else v.pause();
  }, [playing, job.preview]);

  return (
    <div ref={ref} {...bind} className="panel lift flex flex-col gap-4 rounded-lg p-3 sm:flex-row sm:items-stretch">
      <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-md bg-surface-2 sm:w-[300px]">
        {job.status === "failed" ? (
          <div className="absolute inset-0 grid place-items-center bg-danger/5">
            <CircleAlert className="size-8 text-danger/70" strokeWidth={1.6} />
          </div>
        ) : job.status === "ready" ? (
          job.poster ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={job.poster} alt="" className="absolute inset-0 size-full object-cover" loading="lazy" />
              <video ref={video} muted loop playsInline preload="none" className={cn("absolute inset-0 size-full object-cover transition-opacity", playing ? "opacity-100" : "opacity-0")} />
            </>
          ) : (
            <PresetMedia presetId={job.presetId ?? "podpishis"} playing={playing} className="absolute inset-0 [&>div]:!h-full" />
          )
        ) : (
          <div className="skeleton absolute inset-0 grid place-items-center">
            <span className="rounded-full bg-bg/70 px-3 py-1.5 text-[13px] font-medium tabular-nums">
              {job.status === "queued" ? "В очереди" : `Генерируем · ${progress}%`}
            </span>
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col py-1">
        <p className="line-clamp-2 text-[15px] leading-snug font-medium">{job.prompt}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {job.alpha && <Badge tone="accent">С альфа-каналом</Badge>}
          <Badge>{job.format}</Badge>
          <Badge>{job.duration} сек</Badge>
          <span className="t-meta t-num">· {job.cost} кр.</span>
        </div>
        {job.status === "failed" ? (
          <ErrorState
            className="mt-auto"
            title="Не получилось сгенерировать"
            text={job.error ?? "Попробуйте упростить описание."}
            refunded={job.cost}
            onRetry={() => toast({ text: "Повторяем с упрощённым промптом" })}
          />
        ) : (
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          <Button
            size="sm"
            variant={job.status === "ready" ? "primary" : "secondary"}
            disabled={job.status !== "ready"}
            onClick={() => toast({ text: `Скачивание: ${job.format}` })}
          >
            <Download /> Скачать
          </Button>
          <Button size="sm" cost={costs.insert} disabled={job.status !== "ready"}>
            <Shuffle /> Вариация
          </Button>
          <Button size="sm" variant="ghost" disabled={job.status !== "ready"}>
            <RefreshCw /> Повторить
          </Button>
        </div>
        )}
      </div>
    </div>
  );
}
