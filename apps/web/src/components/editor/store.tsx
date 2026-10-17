"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from "react";
import type { Attachment, Block, ChatMessage, GenSpec, Word } from "@lumenkit/core";
import type { ProjectData } from "@/server/projects";

/* ---------- Время воспроизведения: внешний стор, чтобы 60 к/с не перерисовывали всё дерево ---------- */

export function createClock() {
  let t = 0;
  const subs = new Set<() => void>();
  return {
    get: () => t,
    set: (v: number) => {
      t = v;
      subs.forEach((s) => s());
    },
    subscribe: (cb: () => void) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
  };
}
export type Clock = ReturnType<typeof createClock>;

/* ---------- Состояние монтажа с историей (Undo/Redo) ---------- */

type Snapshot = { blocks: Block[]; deleted: string[] };
type History = { past: Snapshot[]; present: Snapshot; future: Snapshot[] };
type HistoryAction =
  | { type: "commit"; fn: (s: Snapshot) => Snapshot }
  | { type: "patch"; fn: (s: Snapshot) => Snapshot }
  | { type: "undo" }
  | { type: "redo" };

function historyReducer(h: History, a: HistoryAction): History {
  switch (a.type) {
    case "commit":
      return { past: [...h.past.slice(-49), h.present], present: a.fn(h.present), future: [] };
    case "patch":
      // Мелкие правки параметров (ползунки) — без записи в историю
      return { ...h, present: a.fn(h.present) };
    case "undo":
      if (!h.past.length) return h;
      return { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future] };
    case "redo":
      if (!h.future.length) return h;
      return { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) };
  }
}

type Editor = {
  clock: Clock;
  duration: number;
  playing: boolean;
  setPlaying: (v: boolean) => void;
  seek: (t: number) => void;
  registerSeek: (fn: (t: number) => void) => void;

  /** Транскрипт ролика (слова с таймингом) */
  words: Word[];
  blocks: Block[];
  deleted: Set<string>;
  selectedId: string | null;
  select: (id: string | null) => void;

  commit: (fn: (s: Snapshot) => Snapshot) => void;
  patch: (fn: (s: Snapshot) => Snapshot) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  chat: ChatMessage[];
  setChat: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  /** Пресеты-примеры, прикреплённые к следующему сообщению в чат */
  attached: string[];
  setAttached: React.Dispatch<React.SetStateAction<string[]>>;
  /** Claude сейчас правит монтаж — плеер и таймлайн показывают это */
  directing: boolean;
  setDirecting: (v: boolean) => void;
  /** Блоки, которые только что появились или поменялись (для анимации на таймлайне) */
  fresh: Set<string>;
};

const Ctx = createContext<Editor | null>(null);

export function useEditor() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useEditor вне EditorProvider");
  return v;
}

export function useTime() {
  const { clock } = useEditor();
  return useSyncExternalStore(clock.subscribe, clock.get, () => 0);
}

export const HANDOFF_KEY = "lumenkit:handoff";

export function EditorProvider({ data, children }: { data: ProjectData; children: React.ReactNode }) {
  const { duration } = data.project;
  const words = data.words;
  const clock = useMemo(createClock, []);
  const [playing, setPlaying] = useState(false);
  const [selectedId, select] = useState<string | null>(null);
  const [hist, dispatch] = useReducer(historyReducer, {
    past: [],
    present: { blocks: data.blocks, deleted: data.cuts },
    future: [],
  });
  const { past, present, future } = hist;
  const [chat, setChat] = useState<ChatMessage[]>(data.chat);
  const [attached, setAttached] = useState<string[]>([]);
  const seekFn = useRef<(t: number) => void>(() => {});
  const [directing, setDirecting] = useState(false);
  const [fresh, setFresh] = useState<Set<string>>(new Set());

  // Промпт с главной становится первым сообщением чата — диалог продолжается, а не начинается заново
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(HANDOFF_KEY);
      if (!raw) return;
      sessionStorage.removeItem(HANDOFF_KEY);
      const h = JSON.parse(raw) as { prompt: string; presets: string[]; files?: Attachment[]; gens?: GenSpec[] };
      if (!h.prompt && !h.files?.length) return;
      const draft = data.chat[0];
      const ask: ChatMessage = { id: "h0", role: "user", text: h.prompt, presets: h.presets, files: h.files };
      if (!draft) return setChat([ask]);
      setChat([
        ask,
        h.gens?.length && draft.role === "assistant" ? { ...draft, text: `${draft.text} Параллельно генерирую ${h.gens.length} AI-${h.gens.length === 1 ? "вставку" : "вставки"}${h.gens.every((g) => g.auto) ? " — где и что, решил сам —" : h.gens.some((g) => g.auto) ? " (часть добавил сам)" : ""} и поставлю их на таймлайн.`, gens: h.gens } : draft,
      ]);
    } catch {}
  }, []);

  // Новые/изменённые блоки подсвечиваются ~1.6 с — так видно, что именно сделал режиссёр
  const prevBlocks = useRef(present.blocks);
  useEffect(() => {
    const prev = new Map(prevBlocks.current.map((b) => [b.id, b]));
    prevBlocks.current = present.blocks;
    const changed = present.blocks
      .filter((b) => {
        const p = prev.get(b.id);
        return !p || p.presetId !== b.presetId || p.label !== b.label || p.start !== b.start || p.end !== b.end;
      })
      .map((b) => b.id);
    if (!changed.length) return;
    setFresh(new Set(changed));
    const t = setTimeout(() => setFresh(new Set()), 1600);
    return () => clearTimeout(t);
  }, [present.blocks]);

  const commit = useCallback((fn: (s: Snapshot) => Snapshot) => dispatch({ type: "commit", fn }), []);
  const patch = useCallback((fn: (s: Snapshot) => Snapshot) => dispatch({ type: "patch", fn }), []);
  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);

  const deleted = useMemo(() => new Set(present.deleted), [present.deleted]);

  const value: Editor = {
    clock,
    duration,
    playing,
    setPlaying,
    seek: (t) => seekFn.current(Math.max(0, Math.min(duration, t))),
    registerSeek: (fn) => {
      seekFn.current = fn;
    },
    words,
    blocks: present.blocks,
    deleted,
    selectedId,
    select,
    commit,
    patch,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    chat,
    setChat,
    attached,
    setAttached,
    directing,
    setDirecting,
    fresh,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Диапазоны, вырезанные через текст (удалённые слова) */
export function cutRanges(words: Word[], deleted: Set<string>) {
  return words.filter((w) => deleted.has(w.id)).map((w) => [w.t, w.t + w.d] as const);
}

export function fmt(t: number) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  const f = Math.floor((t % 1) * 10);
  return `${m}:${String(s).padStart(2, "0")}.${f}`;
}
