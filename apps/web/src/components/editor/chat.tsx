"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Check, Clapperboard, FileText, Layers, Minus, Plus, RefreshCw, Sparkles, Undo2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { costs, suggestions, type Attachment, type ChatMessage, type GenSpec } from "@/lib/mock";
import { presetRegistry as presets } from "@/presets/registry";
import { springs } from "@/lib/motion";
import { useToast } from "@/components/ui/toast";
import { AttachmentList, Composer, PresetChip, TokenText, presetIdsIn } from "@/components/composer";
import { getAiSettings } from "@/lib/ai-settings";
import { modelById } from "@lumenkit/core";
import { planGens } from "@/lib/prompt-tokens";
import { GenCard } from "./gen-card";
import { useEditor } from "./store";

type Assistant = Extract<ChatMessage, { role: "assistant" }>;

export type QuickAction = { title: string; sub: string; prompt: string; icon: React.ReactNode };

export function Chat({ quickActions }: { quickActions?: QuickAction[] }) {
  const ed = useEditor();
  const toast = useToast();
  const [text, setText] = useState("");
  const [thinking, setThinking] = useState(false);
  const [files, setFiles] = useState<Attachment[]>([]);
  // Сообщение, которое сейчас «печатается» потоком
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const { attached, setAttached } = ed;
  const list = useRef<HTMLDivElement>(null);

  // Прокрутка вниз только при новых сообщениях — при открытии видны быстрые действия сверху
  const seen = useRef(ed.chat.length);
  useEffect(() => {
    if (ed.chat.length === seen.current && !thinking) return;
    seen.current = ed.chat.length;
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [ed.chat.length, thinking]);

  const setState = (id: string, state: Assistant["state"]) =>
    ed.setChat((c) => c.map((m) => (m.id === id && m.role === "assistant" ? { ...m, state } : m)));

  const send = (q: string) => {
    if ((!q.trim() && attached.length === 0 && files.length === 0) || thinking) return;
    const withPresets = [...new Set([...attached, ...presetIdsIn(q)])];
    const sent = files;
    const refs = sent.filter((f) => f.kind === "image").map((f) => f.url);
    // Правка в чате: в авто-режиме Claude генерирует сам, только если просят визуал или дали фото
    const gens = planGens(q, { ...getAiSettings(), refs, editOnly: true });
    ed.setChat((c) => [
      ...c,
      { id: `u${Date.now()}`, role: "user", text: q.trim() || (sent.length ? "Используй это" : "Сделай как в примере"), presets: withPresets, files: sent },
    ]);
    setText("");
    setAttached([]);
    setFiles([]);
    setThinking(true);
    ed.setDirecting(true);
    setTimeout(() => {
      const reply = gens.length ? directGens(gens, sent) : refs.length ? placeFiles(sent, ed) : respond(q.toLowerCase(), ed, withPresets);
      setStreamingId(reply.id);
      ed.setChat((c) => [...c, reply]);
      setThinking(false);
    }, 1350);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={list} className="min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-4">
        {quickActions && (
          <div className="mb-5 flex flex-col gap-2">
            {quickActions.map((a) => (
              <button
                key={a.title}
                onClick={() => send(a.prompt)}
                className="press flex items-center gap-3.5 rounded-md bg-surface-2 p-3 text-left hover:bg-surface-3"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-sm text-white" style={{ background: "var(--accent-grad)" }}>
                  {a.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-medium">{a.title}</span>
                  <span className="block truncate text-[13px] text-fg-subtle">{a.sub}</span>
                </span>
              </button>
            ))}
          </div>
        )}
        <div className="flex flex-col gap-4">
          <AnimatePresence initial={false}>
            {ed.chat.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={springs.ui}
                className={cn(m.role === "user" && "flex justify-end")}
              >
                {m.role === "user" ? (
                  <div className="flex max-w-[88%] flex-col items-end gap-1.5">
                    {m.presets && m.presets.some((id) => !presetIdsIn(m.text).includes(id)) && (
                      <div className="flex flex-wrap justify-end gap-1">
                        {m.presets.filter((id) => !presetIdsIn(m.text).includes(id)).map((id) => {
                          const p = presets.find((x) => x.id === id);
                          return p ? <PresetChip key={id} preset={p} /> : null;
                        })}
                      </div>
                    )}
                    {m.files && m.files.length > 0 && (
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <AttachmentList files={m.files} size="sm" />
                      </div>
                    )}
                    <div className="rounded-md rounded-br-xs bg-surface-3 px-3.5 py-2 text-[14px] leading-[1.6]">
                      <TokenText text={m.text} />
                    </div>
                  </div>
                ) : (
                  <AssistantMsg
                    m={m}
                    stream={m.id === streamingId}
                    onStreamed={() => {
                      setStreamingId(null);
                      ed.setDirecting(false);
                    }}
                    onAccept={() => setState(m.id, "applied")}
                    onRevert={() => {
                      setState(m.id, "reverted");
                      ed.undo();
                      toast({ text: "Правка откатана" });
                    }}
                  />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {thinking && <DirectorSteps />}
        </div>
      </div>

      <div className="border-t border-line p-3">
        <div className="-mx-1 mb-2 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="press h-7 shrink-0 rounded-xs bg-surface-2 px-2.5 text-[12px] text-fg-muted hover:text-fg"
            >
              {s}
            </button>
          ))}
        </div>
        <Composer
          size="chat"
          allowVideo={false}
          value={text}
          onChange={setText}
          attached={attached}
          onAttach={(id) => setAttached((x) => (x.includes(id) ? x : [...x, id]))}
          onDetach={(id) => setAttached((x) => x.filter((y) => y !== id))}
          files={files}
          onFiles={setFiles}
          onSubmit={() => send(text)}
          cost={costs.chatEdit}
          disabled={thinking}
          placeholder="Что поменять? Можно приложить фото"
        />
      </div>
    </div>
  );
}

/* Что делает режиссёр, пока думает: три шага по очереди */
const STEPS = [
  { icon: FileText, label: "Читаю расшифровку" },
  { icon: Layers, label: "Подбираю пресеты" },
  { icon: Clapperboard, label: "Ставлю на таймлайн" },
];

function DirectorSteps() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => Math.min(STEPS.length - 1, v + 1)), 420);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex flex-col gap-2 rounded-md bg-surface-2 p-3" aria-live="polite">
      <div className="flex items-center gap-2 text-[13px] font-medium">
        <Sparkles className="size-4 animate-spin text-accent-hover [animation-duration:2.4s]" />
        Claude правит монтаж
      </div>
      <ol className="flex flex-col gap-1.5 pl-6">
        {STEPS.map((st, k) => (
          <motion.li
            key={st.label}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: k <= i ? 1 : 0.35, x: 0 }}
            transition={{ ...springs.ui, delay: k * 0.06 }}
            className={cn("flex items-center gap-2 text-[13px]", k < i ? "text-fg-subtle" : k === i ? "text-fg" : "text-fg-subtle")}
          >
            {k < i ? <Check className="size-3.5 text-success" /> : <st.icon className={cn("size-3.5", k === i && "text-accent-hover")} />}
            {st.label}
          </motion.li>
        ))}
      </ol>
    </div>
  );
}

/* Текст ответа печатается по словам, как у ChatGPT/Claude */
function StreamText({ text, onDone }: { text: string; onDone: () => void }) {
  const words = text.split(" ");
  const [n, setN] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    const t = setInterval(() => setN((v) => Math.min(words.length, v + 1)), 38);
    return () => clearInterval(t);
  }, [words.length]);
  useEffect(() => {
    if (n >= words.length && !done.current) {
      done.current = true;
      onDone();
    }
  }, [n, words.length, onDone]);
  return (
    <>
      {words.slice(0, n).join(" ")}
      {n < words.length && <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-accent-hover" />}
    </>
  );
}

function AssistantMsg({
  m,
  stream,
  onStreamed,
  onAccept,
  onRevert,
}: {
  m: Assistant;
  stream?: boolean;
  onStreamed?: () => void;
  onAccept: () => void;
  onRevert: () => void;
}) {
  const icon = { add: Plus, remove: Minus, swap: RefreshCw };
  const [typed, setTyped] = useState(!stream);
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[14px] leading-relaxed text-fg">
        {stream && !typed ? (
          <StreamText
            text={m.text}
            onDone={() => {
              setTyped(true);
              onStreamed?.();
            }}
          />
        ) : (
          m.text
        )}
      </p>
      {m.gens && typed && (
        <div className="flex flex-col gap-2">
          {m.gens.map((g, i) => (
            <GenCard key={g.id} gen={g} index={i} />
          ))}
        </div>
      )}
      {m.changes && typed && (
        <motion.div
          initial={stream ? { opacity: 0, y: 6 } : false}
          animate={{ opacity: m.state === "reverted" ? 0.5 : 1, y: 0 }}
          transition={springs.ui}
          className="rounded-md bg-surface-2 p-1"
        >
          <ul>
            {m.changes.map((c, i) => {
              const Icon = icon[c.kind];
              return (
                <motion.li
                  key={i}
                  initial={stream ? { opacity: 0, x: -8 } : false}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...springs.ui, delay: 0.06 + i * 0.07 }}
                  className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-[13px]"
                >
                  <Icon
                    className={cn(
                      "size-3.5 shrink-0",
                      c.kind === "add" && "text-success",
                      c.kind === "remove" && "text-danger",
                      c.kind === "swap" && "text-accent-hover",
                    )}
                  />
                  <span className={cn("flex-1", m.state === "reverted" && "line-through")}>{c.label}</span>
                  <span className="text-[11px] text-fg-subtle tabular-nums">{c.at}</span>
                </motion.li>
              );
            })}
          </ul>
          <div className="flex items-center gap-1 border-t border-line px-1 pt-1">
            {m.state === "pending" ? (
              <>
                <button onClick={onAccept} className="press flex h-8 items-center gap-1.5 rounded-sm px-2.5 text-[13px] font-medium text-fg hover:bg-surface-3">
                  <Check className="size-3.5" /> Принять
                </button>
                <button onClick={onRevert} className="press flex h-8 items-center gap-1.5 rounded-sm px-2.5 text-[13px] text-fg-muted hover:bg-surface-3 hover:text-fg">
                  <Undo2 className="size-3.5" /> Откатить
                </button>
              </>
            ) : (
              <span className="flex h-8 items-center px-2.5 text-[12px] text-fg-subtle">
                {m.state === "reverted" ? "Откатано" : "Применено"}
              </span>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Генерации: Claude пишет промпты для моделей, карточки сами ставят результат на таймлайн
function directGens(gens: GenSpec[], files: Attachment[] = []): Assistant {
  const names = [...new Set(gens.map((g) => modelById(g.model)?.label ?? g.model))].join(", ");
  const auto = gens.filter((g) => g.auto).length;
  const ref = files.some((f) => f.kind === "image") && gens.some((g) => g.ref);
  const parts = [
    `Генерирую ${gens.length} ${gens.length === 1 ? "вставку" : gens.length < 5 ? "вставки" : "вставок"} · ${names}.`,
    auto ? `${auto === gens.length ? "Где и что вставить, решил сам" : `${auto} из них добавил сам`} — промпты видно в карточках.` : "",
    ref ? "Ваше фото беру как референс." : "",
    "Каждый результат проверю перед тем, как поставить; не выйдет за 3 попытки — кредиты вернутся.",
  ];
  return {
    id: `a${Date.now()}`,
    role: "assistant",
    text: parts.filter(Boolean).join(" "),
    gens,
    changes: gens.map((g) => ({ kind: "add" as const, label: `${modelById(g.model)?.label ?? g.model}: ${g.prompt}`, at: `00:${String(g.at).padStart(2, "0")}` })),
    state: "pending",
  };
}

// Фото без генерации — ставим как есть: «вставь это на 10-й секунде»
function placeFiles(files: Attachment[], ed: ReturnType<typeof useEditor>): Assistant {
  const imgs = files.filter((f) => f.kind === "image");
  const t = ed.clock.get();
  ed.commit((s) => ({
    ...s,
    blocks: [
      ...s.blocks,
      ...imgs.map((f, i) => ({
        id: `file-${f.id}`,
        track: "media" as const,
        start: t + i * 3,
        end: t + i * 3 + 3,
        label: f.name,
        presetId: "ai-media",
        params: { src: f.url, kind: "image", layout: "card" },
      })),
    ],
  }));
  return {
    id: `a${Date.now()}`,
    role: "assistant",
    text: `Поставил ${imgs.length === 1 ? "фото" : `${imgs.length} фото`} карточкой с ${tcShort(t)} — с мягким входом и наездом. Хотите на весь кадр или оживить через Seedance — скажите.`,
    changes: imgs.map((f, i) => ({ kind: "add" as const, label: `Фото: ${f.name}`, at: tcShort(t + i * 3) })),
    state: "pending",
  };
}

const tcShort = (t: number) => `00:${String(Math.floor(t)).padStart(2, "0")}`;

// Мок «режиссёра»: применяет правку к монтажу и возвращает дифф.
function respond(q: string, ed: ReturnType<typeof useEditor>, withPresets: string[] = []): Assistant {
  const id = `a${Date.now()}`;
  const example = presets.find((p) => p.id === withPresets[0]);
  if (example && !/пауз|паразит|хук|переход|музык/.test(q)) {
    const track = example.category === "captions" ? "captions" : example.category === "zooms" ? "zooms" : example.category === "transitions" ? "transitions" : "plates";
    ed.commit((s) => ({
      ...s,
      blocks:
        track === "captions"
          ? s.blocks.map((b) => (b.track === "captions" ? { ...b, presetId: example.id, label: example.name } : b))
          : [...s.blocks, { id: `b-x${Date.now()}`, track, start: 8, end: track === "plates" ? 12 : 9, label: example.name, presetId: example.id }],
    }));
    return {
      id,
      role: "assistant",
      text: `Взял «${example.name}» как пример и подогнал под ваш бренд-кит.`,
      changes: [{ kind: track === "captions" ? "swap" : "add", label: example.name, at: track === "captions" ? "00:00" : "00:08" }],
      state: "pending",
    };
  }
  if (q.includes("пауз") || q.includes("паразит")) {
    const fill = ed.words.filter((w) => w.filler && !ed.deleted.has(w.id));
    ed.commit((s) => ({ ...s, deleted: [...s.deleted, ...fill.map((f) => f.id)] }));
    return {
      id,
      role: "assistant",
      text: fill.length ? `Вырезал ${fill.length} фрагмента: «эээ» и «короче». Ролик стал короче на 0,9 с.` : "Пауз и паразитов больше не нашёл.",
      changes: fill.map((f) => ({ kind: "remove" as const, label: `«${f.text}»`, at: `00:${String(Math.floor(f.t)).padStart(2, "0")}` })),
      state: "pending",
    };
  }
  if (q.includes("хук")) {
    ed.commit((s) => ({
      ...s,
      blocks: [...s.blocks, { id: `b-h${Date.now()}`, track: "plates", start: 0, end: 2.2, label: "Хук: вопрос", presetId: "vopros" }],
    }));
    return {
      id,
      role: "assistant",
      text: "Добавил хук «Ты тоже так делаешь?» на первые 2 секунды — крупно сверху, чтобы не перекрывать лицо.",
      changes: [{ kind: "add", label: "Плашка «Вопрос в лоб»", at: "00:00" }],
      state: "pending",
    };
  }
  if (q.includes("переход")) {
    ed.commit((s) => ({
      ...s,
      blocks: s.blocks.map((b) => (b.track === "transitions" ? { ...b, label: "Шторка", presetId: "shtorka" } : b)),
    }));
    return {
      id,
      role: "assistant",
      text: "Заменил оба перехода на «Шторку» в акцентном цвете.",
      changes: [{ kind: "swap", label: "Вспышка → Шторка", at: "00:11" }],
      state: "pending",
    };
  }
  if (q.includes("музык")) {
    ed.commit((s) => ({ ...s, blocks: s.blocks.map((b) => (b.track === "music" ? { ...b, label: "Lo-fi · −24 дБ, приглушение под голос" } : b)) }));
    return {
      id,
      role: "assistant",
      text: "Музыка тише на 6 дБ и автоматически приглушается, когда вы говорите.",
      changes: [{ kind: "swap", label: "Музыка: −18 → −24 дБ, дакинг", at: "00:00" }],
      state: "pending",
    };
  }
  ed.commit((s) => ({
    ...s,
    blocks: [...s.blocks, { id: `b-z${Date.now()}`, track: "zooms", start: 6.4, end: 7.4, label: "Панч-зум", presetId: "punch" }],
  }));
  return {
    id,
    role: "assistant",
    text: "Поставил панч-зум на слове «звуки» — это главный акцент фразы.",
    changes: [{ kind: "add", label: "Панч-зум", at: "00:06" }],
    state: "pending",
  };
}
