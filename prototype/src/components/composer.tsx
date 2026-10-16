"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowUp, Clapperboard, File as FileIcon, Film, ImageIcon, Layers, Paperclip, Plus, Sparkles, Wand2, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { presetCategories, presetRegistry as presets } from "@/presets/registry";
import type { PresetDef as Preset } from "@/presets/types";
import { springs } from "@/lib/motion";
import { credits, type Attachment } from "@/lib/mock";
import { genModels, type GenModel } from "@/lib/models";
import { setAiSettings, useAiSettings } from "@/lib/ai-settings";
import { estimate, gensIn, presetToken, segments, togglePresetIn } from "@/lib/prompt-tokens";
import { NoCredits } from "@/components/ui/states";
import { SuggestList, suggestContext, suggestions, type Suggestion } from "@/components/token-suggest";

export const PRESET_MIME = "application/x-montage-preset";

export type AttachedVideo = { name: string; poster: string; duration: number };

export { presetIdsIn, presetToken, togglePresetIn } from "@/lib/prompt-tokens";

const tokenClass = {
  preset: "bg-accent-soft text-accent-hover shadow-[0_0_0_2px_var(--accent-soft)]",
  image: "bg-gen-image-soft text-gen-image shadow-[0_0_0_2px_var(--gen-image-soft)]",
  video: "bg-gen-video-soft text-gen-video shadow-[0_0_0_2px_var(--gen-video-soft)]",
} as const;

const kindTone = { image: "bg-gen-image-soft text-gen-image", video: "bg-gen-video-soft text-gen-video" } as const;

/** Текст промпта с подсвеченными токенами — подложка под полем и сообщения чата.
 *  Подсветка без отступов и смены начертания, чтобы буквы совпадали с полем ввода. */
export function TokenText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {segments(text).map((s, i) =>
        s.type === "text" ? (
          s.text
        ) : (
          <span key={i} className={cn("rounded-[5px]", tokenClass[s.type === "gen" ? s.model.kind : "preset"])}>
            {s.text}
          </span>
        ),
      )}
    </span>
  );
}

/** Сделать элемент перетаскиваемым стилем (HTML5 DnD). В текстовое поле он встаёт токеном туда, куда отпустили. */
export function presetDragProps(id: string) {
  return {
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.setData(PRESET_MIME, id);
      e.dataTransfer.setData("text/plain", presetToken(id));
      e.dataTransfer.effectAllowed = "copy";
    },
  };
}

export function PresetChip({ preset, onRemove }: { preset: Preset; onRemove?: () => void }) {
  const cat = presetCategories.find((c) => c.id === preset.category)?.label;
  return (
    <motion.span
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={springs.ui}
      className="inline-flex h-8 items-center gap-1.5 rounded-md bg-surface-3 pr-1 pl-1 text-[13px]"
    >
      <span className="grid size-6 place-items-center rounded-sm bg-accent-soft">
        <Layers className="size-3.5 text-accent-hover" />
      </span>
      <span className="font-medium">{preset.name}</span>
      <span className="text-[12px] text-fg-subtle">{cat?.toLowerCase()}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="grid size-6 place-items-center rounded-sm text-fg-subtle hover:bg-bg/60 hover:text-fg"
          aria-label={`Убрать пример «${preset.name}»`}
        >
          <X className="size-3.5" />
        </button>
      )}
    </motion.span>
  );
}

/** Файл из браузера → вложение (в прототипе — локальная ссылка, в продукте — загрузка в S3) */
export function toAttachment(f: File): Attachment {
  const kind = f.type.startsWith("image/") ? "image" : f.type.startsWith("video/") ? "video" : "file";
  return { id: `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, name: f.name || "Вставленное фото.png", url: URL.createObjectURL(f), kind };
}

/** Миниатюры вложений — в поле ввода и в сообщениях чата */
export function AttachmentList({ files, onRemove, size = "md" }: { files: Attachment[]; onRemove?: (id: string) => void; size?: "sm" | "md" }) {
  const box = size === "sm" ? "size-14" : "size-16";
  return (
    <AnimatePresence initial={false}>
      {files.map((f) => (
        <motion.span
          key={f.id}
          layout
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={springs.ui}
          className={cn("group relative shrink-0 overflow-hidden rounded-md bg-surface-3 ring-1 ring-line-strong", box)}
          title={f.name}
        >
          {f.kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={f.url} alt={f.name} className="size-full object-cover" />
          ) : (
            <span className="grid size-full place-items-center px-1 text-center">
              {f.kind === "video" ? <Film className="size-5 text-fg-muted" /> : <FileIcon className="size-5 text-fg-muted" />}
              <span className="line-clamp-1 w-full text-[10px] text-fg-subtle">{f.name}</span>
            </span>
          )}
          {onRemove && (
            <button
              onClick={() => onRemove(f.id)}
              aria-label={`Убрать «${f.name}»`}
              className="absolute top-1 right-1 grid size-5 place-items-center rounded-full bg-bg/80 text-fg-muted opacity-0 backdrop-blur group-hover:opacity-100 hover:text-fg focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
            >
              <X className="size-3" />
            </button>
          )}
        </motion.span>
      ))}
    </AnimatePresence>
  );
}

export function Composer({
  value,
  onChange,
  attached,
  onAttach,
  onDetach,
  video,
  onVideo,
  files = [],
  onFiles,
  onSubmit,
  cost,
  placeholder,
  size = "hero",
  disabled,
  allowVideo = true,
  chips,
  balance = credits.balance,
  extras,
}: {
  value: string;
  onChange: (v: string) => void;
  attached: string[];
  onAttach: (id: string) => void;
  onDetach: (id: string) => void;
  video?: AttachedVideo | null;
  onVideo?: (v: AttachedVideo | null) => void;
  /** Вложения как в Claude: фото, файлы — Claude учитывает их в ответе */
  files?: Attachment[];
  onFiles?: (f: Attachment[]) => void;
  onSubmit: () => void;
  /** Базовая цена действия без генераций */
  cost: number;
  placeholder: string;
  size?: "hero" | "chat";
  disabled?: boolean;
  allowVideo?: boolean;
  /** Подсказки-чипы над полем ввода (как во втором референсе) */
  chips?: { label: string; text?: string; onClick: () => void }[];
  /** Баланс кредитов (по умолчанию — из профиля) */
  balance?: number;
  /** Доп. переключатели в нижней строке (формат, фон и т.п.) */
  extras?: React.ReactNode;
}) {
  const [over, setOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const mirror = useRef<HTMLDivElement>(null);
  const caret = useRef<number | null>(null);
  // Подсказки при вводе «{»
  const [caretPos, setCaretPos] = useState(0);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const [dismissed, setDismissed] = useState<number | null>(null);
  const [anchor, setAnchor] = useState<{ left: number; top: number; bottom: number } | null>(null);
  const marker = useRef<HTMLSpanElement>(null);
  // Куда поставить курсор после программной вставки — сразу после обновления текста, до следующей клавиши
  const pendingCaret = useRef<number | null>(null);
  const fieldBox = useRef<HTMLDivElement>(null);
  const ctx = focused ? suggestContext(value, caretPos) : null;
  const items = ctx && ctx.start !== dismissed ? suggestions(ctx.query) : [];
  const suggestOpen = items.length > 0;
  const syncCaret = (el: HTMLTextAreaElement) => {
    caret.current = el.selectionStart;
    setCaretPos(el.selectionStart);
  };
  // Новый запрос — подсветка снова на первом пункте
  const query = ctx?.query;
  useEffect(() => setActive(0), [query]);
  // Где сейчас курсор — по метке в подложке (та же вёрстка, что у поля)
  useLayoutEffect(() => {
    if (!suggestOpen || !marker.current || !mirror.current || !fieldBox.current) return setAnchor(null);
    const m = marker.current;
    const top = m.offsetTop - mirror.current.scrollTop;
    setAnchor({ left: m.offsetLeft, top, bottom: fieldBox.current.offsetHeight - top });
  }, [suggestOpen, value, caretPos]);

  const pickSuggestion = (sg: Suggestion) => {
    if (!ctx) return;
    let rest = value.slice(caretPos);
    if (rest.startsWith("}")) rest = rest.slice(1);
    const snippet = sg.type === "preset" && rest.startsWith(" ") ? sg.snippet.trimEnd() : sg.snippet;
    onChange(value.slice(0, ctx.start) + snippet + rest);
    pendingCaret.current = ctx.start + snippet.length - sg.back;
  };
  const ai = useAiSettings();

  // Поле растёт вместе с текстом, дальше — прокрутка (подложка с токенами едет следом)
  useLayoutEffect(() => {
    const el = field.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
    if (pendingCaret.current !== null) {
      const pos = pendingCaret.current;
      pendingCaret.current = null;
      el.focus();
      el.setSelectionRange(pos, pos);
      caret.current = pos;
      setCaretPos(pos);
    }
  }, [value]);

  const hero = size === "hero";
  const est = estimate(cost, value, ai);
  const gens = gensIn(value);
  // Кредитов не хватает на точную часть — говорим до отправки, предпросмотр остаётся бесплатным
  const lacking = cost + est.exact > balance;
  const canSend = !disabled && !lacking && (value.trim().length > 0 || attached.length > 0 || !!video || files.length > 0);

  // Вставить шаблон токена туда, где был курсор, и поставить курсор внутрь: {nano-banana: |}
  const insertAtCaret = (snippet: string, back = 0) => {
    const at = caret.current ?? value.length;
    const before = value.slice(0, at);
    const pad = before && !/\s$/.test(before) ? " " : "";
    onChange(before + pad + snippet + value.slice(at));
    pendingCaret.current = before.length + pad.length + snippet.length - back;
  };

  const addFiles = (list: FileList | File[]) => {
    const arr = [...list];
    const vid = allowVideo && !video ? arr.find((f) => f.type.startsWith("video/")) : undefined;
    if (vid) onVideo?.({ name: vid.name, poster: "/media/v2.webp", duration: 46 });
    const rest = arr.filter((f) => f !== vid);
    if (rest.length && onFiles) onFiles([...files, ...rest.map(toAttachment)]);
  };

  return (
    <div
      onDragOver={(e) => {
        const preset = e.dataTransfer.types.includes(PRESET_MIME);
        if (preset || e.dataTransfer.types.includes("Files")) {
          // Над самим полем браузер сам ставит курсор вставки стиля — не мешаем ему
          if (!(preset && e.target === field.current)) e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
          setOver(true);
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false);
      }}
      onDrop={(e) => {
        setOver(false);
        const id = e.dataTransfer.getData(PRESET_MIME);
        // Отпустили стиль на текст — браузер вставит {Стиль} ровно под курсором
        if (id && e.target === field.current) return;
        e.preventDefault();
        if (id) {
          if (!value.includes(presetToken(id))) onChange(togglePresetIn(value, id));
        } else if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
      }}
      className={cn(
        "relative border transition-[border-color,box-shadow] duration-150",
        hero ? "panel-raised focus-glow rounded-xl border-transparent p-4 md:p-5" : "focus-glow rounded-md border-line bg-surface-2 p-2",
        over && "border-accent shadow-[0_0_0_3px_var(--accent-soft)]",
      )}
    >
      {hero && chips && chips.length > 0 && (
        <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 [scrollbar-width:none]">
          {chips.map((c) => {
            const active = !!c.text && c.text === value;
            return (
              <button
                key={c.label}
                onClick={c.onClick}
                aria-pressed={active}
                className={cn(
                  "press max-w-[200px] shrink-0 rounded-md px-3.5 py-2.5 text-left text-[13px] leading-[1.3] transition-colors duration-200",
                  active ? "bg-accent-soft text-accent-hover ring-1 ring-accent/40" : "bg-surface-3 text-fg-muted hover:bg-surface-2 hover:text-fg",
                )}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      )}

      {(video || attached.length > 0 || files.length > 0) && (
        <div className={cn("flex flex-wrap items-center gap-1.5", hero ? "pb-3" : "px-1 pb-1.5")}>
          {video && (
            <span className="inline-flex h-16 items-center gap-2.5 rounded-md bg-surface-3 py-1 pr-1.5 pl-1 text-[13px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={video.poster} alt="" className="h-14 w-8 rounded-[6px] object-cover" />
              <span className="flex flex-col">
                <span className="max-w-[160px] truncate font-medium">{video.name}</span>
                <span className="font-mono text-[12px] text-fg-subtle tabular-nums">ролик · 0:{String(video.duration).padStart(2, "0")}</span>
              </span>
              <button
                onClick={() => onVideo?.(null)}
                className="grid size-7 place-items-center rounded-sm text-fg-subtle hover:bg-bg/60 hover:text-fg"
                aria-label="Убрать ролик"
              >
                <X className="size-3.5" />
              </button>
            </span>
          )}
          <AttachmentList files={files} size={hero ? "md" : "sm"} onRemove={onFiles ? (id) => onFiles(files.filter((f) => f.id !== id)) : undefined} />
          <AnimatePresence initial={false}>
            {attached.map((id) => {
              const p = presets.find((x) => x.id === id);
              return p ? <PresetChip key={id} preset={p} onRemove={() => onDetach(id)} /> : null;
            })}
          </AnimatePresence>
        </div>
      )}

      <label className="sr-only" htmlFor={`composer-${size}`}>
        {placeholder}
      </label>
      <div
        ref={fieldBox}
        className={cn(
          "relative rounded-sm transition-[background-color,box-shadow] duration-150",
          over && "bg-accent-soft/40 shadow-[0_0_0_1px_var(--accent-soft)]",
        )}
      >
        {/* Подложка: тот же текст, но токены подсвечены. Поле поверх прозрачное, курсор виден */}
        <div
          ref={mirror}
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 overflow-hidden px-1 break-words whitespace-pre-wrap",
            hero ? "text-[16px] leading-[1.5] md:text-[17px]" : "py-1.5 text-[14px]",
          )}
        >
          {/* Пробел нулевой ширины держит высоту последней пустой строки.
              Пока открыты подсказки — метка на месте курсора, по ней ставим список */}
          {suggestOpen ? (
            <>
              <TokenText text={value.slice(0, caretPos)} />
              <span ref={marker} />
              <TokenText text={`${value.slice(caretPos)}​`} />
            </>
          ) : (
            <TokenText text={`${value}​`} />
          )}
        </div>
        <textarea
          ref={field}
          id={`composer-${size}`}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            syncCaret(e.target);
            if (dismissed !== null && !e.target.value.slice(0, e.target.selectionStart).includes("{", dismissed)) setDismissed(null);
          }}
          onSelect={(e) => syncCaret(e.currentTarget)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          role="combobox"
          aria-expanded={suggestOpen}
          aria-autocomplete="list"
          onScroll={(e) => mirror.current && (mirror.current.scrollTop = e.currentTarget.scrollTop)}
          onPaste={(e) => {
            // Ctrl+V фото — как в Claude: становится вложением
            const imgs = [...e.clipboardData.files].filter((f) => f.type.startsWith("image/"));
            if (imgs.length && onFiles) {
              e.preventDefault();
              addFiles(imgs);
            }
          }}
          onKeyDown={(e) => {
            if (suggestOpen) {
              if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => (a + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length);
                return;
              }
              if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                pickSuggestion(items[active] ?? items[0]);
                return;
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setDismissed(ctx!.start);
                return;
              }
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (canSend) onSubmit();
            }
          }}
          rows={hero ? 2 : 1}
          placeholder={placeholder}
          className={cn(
            "relative block w-full resize-none bg-transparent px-1 break-words text-transparent caret-fg outline-none placeholder:text-fg-subtle focus-visible:outline-none",
            hero ? "max-h-[240px] text-[16px] leading-[1.5] md:text-[17px]" : "max-h-32 min-h-8 py-1.5 text-[14px]",
          )}
        />
        <AnimatePresence>
          {suggestOpen && anchor && (
            <SuggestList
              key="suggest"
              items={items}
              active={active}
              onHover={setActive}
              onPick={pickSuggestion}
              above={!hero}
              style={{
                left: Math.max(0, Math.min(anchor.left - 8, (fieldBox.current?.offsetWidth ?? 300) - 300)),
                ...(hero ? { top: anchor.top + 30 } : { bottom: anchor.bottom + 6 }),
              }}
            />
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false}>
        {(gens.length > 0 || (ai.auto && hero && value.trim().length > 0)) && <GenSummary key="gens" gens={gens} hero={hero} auto={ai.auto} left={Math.max(0, ai.budget - est.exact)} />}
      </AnimatePresence>

      {lacking && <NoCredits need={cost + est.exact} balance={balance} className={hero ? "mt-3" : "mt-1"} />}

      <div className={cn("flex items-center gap-2", hero ? "pt-3" : "pt-1")}>
        {(onFiles || allowVideo) && (
          <>
            <button
              onClick={() => fileInput.current?.click()}
              title="Прикрепить ролик, фото или файл"
              aria-label="Прикрепить ролик, фото или файл"
              className={cn(
                "press grid shrink-0 place-items-center rounded-full border border-line-strong text-fg-muted hover:border-fg-subtle hover:text-fg",
                hero ? "size-9" : "size-8",
              )}
            >
              <Paperclip className="size-4" />
            </button>
            <input
              ref={fileInput}
              type="file"
              multiple
              accept={allowVideo ? "video/*,image/*,.pdf,.txt,.srt" : "image/*,.pdf,.txt,.srt"}
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </>
        )}
        <GenMenu onPick={insertAtCaret} small={!hero} />
        <AiModeButton small={!hero} />
        {extras}
        <span className="ml-auto hidden font-mono text-[12px] text-fg-subtle tabular-nums sm:inline">
          {ai.auto ? (
            <>
              {cost + est.exact} <span className="text-fg-muted">+ до {Math.max(0, est.upTo - est.exact)}</span> кр.
            </>
          ) : est.exact > 0 ? (
            `${cost} + ${est.exact} = ${cost + est.exact} кр.`
          ) : (
            `${cost} кр.`
          )}
        </span>
        {/* Кнопка «оживает», когда есть что отправить */}
        <motion.button
          onClick={onSubmit}
          disabled={!canSend}
          aria-label={`Отправить, ${cost + est.exact} кр.`}
          animate={{
            scale: canSend ? 1 : 0.9,
            boxShadow: canSend ? "0 0 0 6px var(--accent-soft)" : "0 0 0 0px var(--accent-soft)",
          }}
          whileTap={{ scale: 0.92 }}
          transition={springs.soft}
          className={cn(
            "ml-auto grid shrink-0 place-items-center rounded-full transition-colors duration-200 sm:ml-0",
            canSend ? "bg-primary text-primary-fg hover:bg-primary-hover" : "bg-surface-3 text-fg-subtle",
            hero ? "size-10" : "size-8",
          )}
        >
          <motion.span animate={{ y: canSend ? 0 : 2 }} transition={springs.soft} className="grid">
            <ArrowUp className={hero ? "size-5" : "size-4"} strokeWidth={2.4} />
          </motion.span>
        </motion.button>
      </div>
    </div>
  );
}

/* ---------- Поповеры нижней строки ---------- */

function usePopover() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  return { open, setOpen, root };
}

const popClass = "panel-raised absolute bottom-full left-0 z-30 mb-2 origin-bottom-left rounded-lg p-1.5";
const popMotion = {
  initial: { opacity: 0, y: 6, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 4, scale: 0.98 },
  transition: springs.ui,
};

/** «+»: генерация конкретной моделью или плашка — вставляет шаблон токена под курсор */
function GenMenu({ onPick, small }: { onPick: (snippet: string, back: number) => void; small?: boolean }) {
  const { open, setOpen, root } = usePopover();
  const groups: { title: string; items: GenModel[] }[] = [
    { title: "Картинки", items: genModels.filter((m) => m.kind === "image") },
    { title: "Видео", items: genModels.filter((m) => m.kind === "video") },
  ];
  const pick = (snippet: string) => {
    onPick(snippet, 1);
    setOpen(false);
  };
  return (
    <div ref={root} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Генерация моделью или плашка"
        title="Генерация моделью или плашка"
        className={cn(
          "press flex shrink-0 items-center gap-1.5 rounded-full border border-line-strong text-fg-muted hover:border-fg-subtle hover:text-fg",
          small ? "size-8 justify-center" : "h-9 pr-3.5 pl-2.5 text-[13px] font-medium",
          open && "border-fg-subtle text-fg",
        )}
      >
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={springs.ui} className="grid">
          <Plus className="size-4" />
        </motion.span>
        {!small && <span>Модель</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div role="menu" {...popMotion} className={cn(popClass, "w-[320px]")}>
            {groups.map((g) => (
              <div key={g.title}>
                <div className="label-mono px-2.5 pt-2 pb-1">{g.title}</div>
                {g.items.map((m) => (
                  <button key={m.id} role="menuitem" onClick={() => pick(`{${m.id}: }`)} className="press flex w-full items-center gap-3 rounded-md p-2.5 text-left hover:bg-surface-2">
                    <span className={cn("grid size-10 shrink-0 place-items-center rounded-sm", kindTone[m.kind])}>
                      {m.kind === "image" ? <ImageIcon className="size-[18px]" /> : <Clapperboard className="size-[18px]" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-medium">{m.label}</span>
                      <span className="t-meta block truncate">{m.strength}</span>
                    </span>
                    <span className="t-num shrink-0 text-[12px] text-fg-subtle">+{m.cost} кр.</span>
                  </button>
                ))}
              </div>
            ))}
            <div className="mt-1 border-t border-line pt-1">
              <button role="menuitem" onClick={() => pick("{Telegram: }")} className="press flex w-full items-center gap-3 rounded-md p-2.5 text-left hover:bg-surface-2">
                <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-accent-soft text-accent-hover">
                  <Layers className="size-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-medium">Плашка со своим текстом</span>
                  <span className="t-meta block truncate">Например {"{Telegram: @канал}"}</span>
                </span>
                <span className="t-num shrink-0 text-[12px] text-fg-subtle">0 кр.</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** AI-режиссёр: «Авто» (по умолчанию) — Claude сам берёт модели и пишет промпты в пределах лимита */
function AiModeButton({ small }: { small?: boolean }) {
  const ai = useAiSettings();
  const { open, setOpen, root } = usePopover();
  const toggleModel = (id: string) =>
    setAiSettings({ models: ai.models.includes(id) ? ai.models.filter((m) => m !== id) : [...ai.models, id] });

  return (
    <div ref={root} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`AI-режиссёр: ${ai.auto ? `авто, до ${ai.budget} кр.` : "вручную"}`}
        className={cn(
          "press flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors",
          small && "h-8 px-2.5",
          ai.auto ? "bg-accent-soft text-accent-hover" : "border border-line-strong text-fg-muted hover:text-fg",
        )}
      >
        <Wand2 className="size-4" />
        {ai.auto ? (small ? "Авто" : `Авто · до ${ai.budget} кр.`) : "Вручную"}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div role="dialog" aria-label="AI-режиссёр" {...popMotion} className={cn(popClass, "w-[340px] p-4")}>
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold">AI-режиссёр</h3>
              <span className="t-meta">для этого и следующих запросов</span>
            </div>

            <div className="mt-3 flex rounded-md bg-surface p-1" role="radiogroup" aria-label="Режим генераций">
              {[
                { v: true, label: "Авто" },
                { v: false, label: "Вручную" },
              ].map((o) => (
                <button
                  key={o.label}
                  role="radio"
                  aria-checked={ai.auto === o.v}
                  onClick={() => setAiSettings({ auto: o.v })}
                  className={cn("relative h-9 flex-1 rounded-sm text-[14px] font-medium", ai.auto === o.v ? "text-fg" : "text-fg-subtle hover:text-fg-muted")}
                >
                  {ai.auto === o.v && <motion.span layoutId="ai-mode" transition={springs.layout} className="absolute inset-0 rounded-sm bg-surface-3" />}
                  <span className="relative">{o.label}</span>
                </button>
              ))}
            </div>
            <p className="t-meta mt-2.5">
              {ai.auto
                ? "Claude сам решит, где нужны картинки и видео, выберет модель, напишет промпт и вставит результат в монтаж. Ваши {модель: …} в тексте выполняются в любом случае."
                : "Генерируется только то, что вы указали в тексте токенами {модель: промпт}."}
            </p>

            <AnimatePresence initial={false}>
              {ai.auto && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={springs.ui} className="overflow-hidden">
                  <label className="mt-4 block">
                    <span className="flex items-baseline justify-between">
                      <span className="text-[13px] font-medium">Лимит на генерации</span>
                      <span className="t-num text-[13px]">до {ai.budget} кр.</span>
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={ai.budget}
                      onChange={(e) => setAiSettings({ budget: +e.target.value })}
                      className="mt-2 w-full accent-[var(--accent)]"
                      aria-label="Лимит кредитов на генерации"
                    />
                    <span className="t-meta flex justify-between">
                      <span>без генераций</span>
                      <span>100</span>
                    </span>
                  </label>

                  <div className="mt-4 text-[13px] font-medium">Модели, которые можно брать</div>
                  <div className="mt-1.5 flex flex-col">
                    {genModels.map((m) => {
                      const on = ai.models.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          role="checkbox"
                          aria-checked={on}
                          onClick={() => toggleModel(m.id)}
                          className="press flex items-center gap-2.5 rounded-sm px-1.5 py-2 text-left hover:bg-surface-2"
                        >
                          <span className={cn("grid size-4 shrink-0 place-items-center rounded-[5px] ring-1", on ? "bg-accent ring-accent" : "ring-line-strong")}>
                            {on && <Sparkles className="size-2.5 text-white" />}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[13px]">
                            {m.label} <span className="text-fg-subtle">· {m.kind === "image" ? "фото" : "видео"}</span>
                          </span>
                          <span className="t-num text-[12px] text-fg-subtle">{m.cost} кр.</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Под полем: что сгенерируется и почём — до отправки */
function GenSummary({ gens, hero, auto, left }: { gens: ReturnType<typeof gensIn>; hero: boolean; auto: boolean; left: number }) {
  const byModel = new Map<string, { m: GenModel; n: number }>();
  for (const g of gens) byModel.set(g.model.id, { m: g.model, n: (byModel.get(g.model.id)?.n ?? 0) + 1 });
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={springs.ui} className="overflow-hidden">
      <div className={cn("flex flex-wrap items-center gap-1.5", hero ? "pt-3" : "px-1 pt-1.5")}>
        <Sparkles className="size-3.5 text-fg-subtle" />
        {[...byModel.values()].map(({ m, n }) => (
          <span key={m.id} className={cn("rounded-full px-2.5 py-1 text-[12px] font-medium", kindTone[m.kind])}>
            {m.label} · {n} · +{m.cost * n} кр.
          </span>
        ))}
        {auto && left > 0 && (
          <span className="rounded-full bg-surface-3 px-2.5 py-1 text-[12px] text-fg-muted">Claude добавит сам, если нужно · до {left} кр.</span>
        )}
      </div>
    </motion.div>
  );
}
