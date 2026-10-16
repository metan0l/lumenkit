"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Check, Loader2, Play, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { costs, projects, type Attachment } from "@/lib/mock";
import { springs } from "@/lib/motion";
import { useAppReady } from "@/lib/use-app-ready";
import { Composer, presetIdsIn, togglePresetIn, type AttachedVideo } from "@/components/composer";
import { LibraryStrip } from "@/components/preset-library";
import { ProjectCard } from "@/components/project-card";
import { Showcase } from "@/components/showcase";
import { HANDOFF_KEY } from "@/components/editor/store";
import { planGens } from "@/lib/prompt-tokens";
import { getAiSettings } from "@/lib/ai-settings";

const steps = ["Загружаем ролик", "Распознаём речь", "Claude монтирует по промпту"];
const EXAMPLE: AttachedVideo = { name: "звуки для монтажа.mp4", poster: "/media/v2.webp", duration: 46 };

export function CreateHub() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [video, setVideo] = useState<AttachedVideo | null>(null);
  const [files, setFiles] = useState<Attachment[]>([]);
  const [step, setStep] = useState(-1);
  const fileInput = useRef<HTMLInputElement>(null);
  const ready = useAppReady();
  // Один оркестрованный вход после прелоадера: сцена → промпт → разделы, шаг 0.08 с
  const enter = (i: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    transition: { ...springs.soft, delay: i * 0.08 },
  });

  // Стили живут прямо в тексте промпта: {Вспышка} после {Удар}
  const attached = presetIdsIn(text);
  const add = (id: string) => setText((t) => togglePresetIn(t, id));

  const submit = () => {
    if (!video) {
      router.push("/inserts");
      return;
    }
    try {
      sessionStorage.setItem(HANDOFF_KEY, JSON.stringify({
          prompt: text.trim(),
          presets: attached,
          files,
          // Авто-режим: Claude сам решает, какие генерации нужны, в пределах лимита
          gens: planGens(text, { ...getAiSettings(), refs: files.filter((f) => f.kind === "image").map((f) => f.url) }),
        }));
    } catch {}
    setStep(0);
    steps.forEach((_, i) => setTimeout(() => setStep(i + 1), 850 * (i + 1)));
    setTimeout(() => router.push("/projects/zvuki-dlya-montazha"), 850 * steps.length + 300);
  };

  const chips = video
    ? [
        { label: "Субтитры крупно и зумы на акцентах", text: "Субтитры крупно, зумы на акцентах, в конце плашка с моим Telegram", onClick: () => setText("Субтитры крупно, зумы на акцентах, в конце плашка с моим Telegram") },
        { label: "AI-вставки под фразы", text: "Крутой эдит: после хука {Вспышка}, на словах про звук {nano-banana: студийный микрофон в неоне}, в конце {seedance-2.5: пролёт камеры над пультом} и {Telegram: @danya_kot}", onClick: () => setText("Крутой эдит: после хука {Вспышка}, на словах про звук {nano-banana: студийный микрофон в неоне}, в конце {seedance-2.5: пролёт камеры над пультом} и {Telegram: @danya_kot}") },
        { label: "Убрать паузы и оговорки", text: "Убери паузы и оговорки, добавь хук в первые 2 секунды", onClick: () => setText("Убери паузы и оговорки, добавь хук в первые 2 секунды") },
        { label: "Сделать как в прошлом ролике", text: "Сделай в стиле моего прошлого ролика «Где брать звуки»", onClick: () => setText("Сделай в стиле моего прошлого ролика «Где брать звуки»") },
        { label: "Музыка под настроение", text: "Подбери спокойную музыку и приглуши её под голос", onClick: () => setText("Подбери спокойную музыку и приглуши её под голос") },
      ]
    : [
        { label: "Плашка «Подписаться» с курсором", text: "Плашка «Подписаться», курсор нажимает, прозрачный фон", onClick: () => setText("Плашка «Подписаться», курсор нажимает, прозрачный фон") },
        { label: "Счётчик подписчиков до 100 000", text: "Счётчик подписчиков 0 → 100 000, крупные цифры", onClick: () => setText("Счётчик подписчиков 0 → 100 000, крупные цифры") },
        { label: "Карточка «Сейчас играет»", text: "Карточка «Сейчас играет» с эквалайзером", onClick: () => setText("Карточка «Сейчас играет» с эквалайзером") },
      ];

  return (
    <div className="mx-auto max-w-[1180px] px-4 md:px-10">
      {/* Сцена: большая скруглённая рамка с роликом, промпт наезжает снизу */}
      <section className="mx-auto max-w-[920px] pt-4 md:pt-2">
        <motion.div {...enter(0)} className="panel-stage relative rounded-2xl p-4 pb-20 md:p-6 md:pb-24">
          <div className="relative flex h-[300px] items-center justify-center overflow-hidden rounded-xl bg-bg-sunken md:h-[380px]">
            {/* «Свет» сцены: два мягких пятна медленно плывут (CSS, только transform) */}
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="lk-drift-a absolute top-[-30%] left-[10%] size-[70%] rounded-full bg-[radial-gradient(closest-side,var(--glow-a),transparent)]" />
              <div className="lk-drift-b absolute right-[5%] bottom-[-35%] size-[65%] rounded-full bg-[radial-gradient(closest-side,var(--glow-b),transparent)]" />
            </div>
            <AnimatePresence mode="wait" initial={false}>
              {video ? (
                <motion.div key="video" className="flex h-full items-center gap-8 px-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={springs.ui}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={video.poster} alt="" className="h-[86%] rounded-lg object-cover" style={{ aspectRatio: "9 / 16" }} />
                  <div className="hidden max-w-[260px] sm:block">
                    <div className="text-[13px] text-fg-subtle">Ролик прикреплён</div>
                    <div className="mt-1 text-[20px] font-medium tracking-[-0.01em]">{video.name}</div>
                    <div className="mt-1 font-mono text-[13px] text-fg-subtle">0:{String(video.duration).padStart(2, "0")} · 9:16 · 30 к/с</div>
                    <p className="mt-4 text-[14px] leading-[1.5] text-fg-muted">Опишите ниже, что сделать: субтитры, зумы, плашки, музыка — Claude соберёт монтаж.</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="empty" className="flex h-full w-full items-center justify-center gap-10 px-6 md:justify-between md:pr-4 md:pl-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={springs.ui}>
                  <div className="flex max-w-[400px] flex-col items-center text-center md:items-start md:text-left">
                    <h1 className="t-display">Что смонтируем?</h1>
                    <p className="t-body mt-3 max-w-[40ch]">
                      Прикрепите свой ролик до 60 секунд и опишите, что нужно. Без ролика — сделаем отдельную вставку.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => fileInput.current?.click()}
                        className="press flex h-11 items-center gap-2 rounded-full bg-primary pr-5 pl-4 text-[14px] font-medium text-primary-fg hover:bg-primary-hover"
                      >
                        <Plus className="size-4" strokeWidth={2.2} /> Прикрепить ролик
                      </button>
                      <button onClick={() => setVideo(EXAMPLE)} className="press flex h-11 items-center gap-2 rounded-full px-4 text-[14px] text-fg-muted hover:bg-surface-2 hover:text-fg">
                        <Play className="size-3.5" fill="currentColor" /> Пример
                      </button>
                    </div>
                  </div>
                  <div className="hidden h-full md:block">
                    <Showcase />
                  </div>
                  <input
                    ref={fileInput}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && setVideo({ ...EXAMPLE, name: e.target.files[0].name })}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div {...enter(1)} className="relative z-10 mx-3 -mt-16 md:mx-10 md:-mt-20">
          {step >= 0 ? (
            <Progress step={step} name={video?.name ?? ""} />
          ) : (
            <Composer
              value={text}
              onChange={setText}
              attached={[]}
              onAttach={add}
              onDetach={() => {}}
              video={video}
              onVideo={setVideo}
              files={files}
              onFiles={setFiles}
              onSubmit={submit}
              cost={video ? costs.autoEdit : costs.insert}
              placeholder={video ? "Что сделать с роликом?" : "Опишите монтаж или вставку…"}
              chips={chips}
            />
          )}
        </motion.div>
      </section>

      <motion.section {...enter(2)} className="mt-16">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="t-heading">Библиотека</h2>
          <Link href="/presets" className="text-[13px] text-fg-subtle hover:text-fg">
            Все пресеты
          </Link>
        </div>
        <LibraryStrip attached={attached} onAdd={add} />
      </motion.section>

      <motion.section {...enter(3)} className="mt-12 mb-12">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="t-heading">Недавние проекты</h2>
          <Link href="/projects" className="text-[13px] text-fg-subtle hover:text-fg">
            Все проекты
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
          {projects.map((p, i) => (
            <ProjectCard key={p.id} project={p} priority={i < 2} />
          ))}
        </div>
      </motion.section>
    </div>
  );
}

function Progress({ step, name }: { step: number; name: string }) {
  return (
    <div className="rounded-xl border border-line-strong bg-surface-2 p-6" aria-live="polite">
      <div className="font-mono text-[12px] text-fg-subtle">{name}</div>
      <ol className="mt-4 flex flex-col gap-3">
        {steps.map((label, i) => {
          const done = step > i;
          const active = step === i;
          return (
            <li key={label} className={cn("flex items-center gap-3 text-[15px]", done || active ? "text-fg" : "text-fg-subtle")}>
              <span className={cn("grid size-6 place-items-center rounded-full", done ? "bg-primary text-primary-fg" : "bg-surface-3", active && "text-accent-hover")}>
                {done ? <Check className="size-3.5" strokeWidth={3} /> : active ? <Loader2 className="size-3.5 animate-spin" /> : null}
              </span>
              {label}
            </li>
          );
        })}
      </ol>
      <p className="mt-5 text-[14px] text-fg-muted">Обычно меньше минуты. Можно уйти — проект появится в списке.</p>
    </div>
  );
}
