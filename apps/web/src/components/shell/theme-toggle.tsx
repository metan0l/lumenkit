"use client";

import { AnimatePresence, motion } from "motion/react";
import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";
import { springs } from "@/lib/motion";
import { THEME_KEY } from "@/lib/theme-script";

/*
 * Тема: тёмная по умолчанию, светлая — по кнопке. Выбор хранится в браузере,
 * до первой отрисовки его ставит THEME_SCRIPT из lib/theme-script.ts (без вспышки тёмной темы).
 * Смена — через View Transitions: новая тема разливается от кнопки мягкой волной (globals.css).
 */

export type Theme = "dark" | "light";
const KEY = THEME_KEY;

const subs = new Set<() => void>();
const read = (): Theme => (document.documentElement.dataset.theme === "light" ? "light" : "dark");

function useTheme() {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    read,
    () => "dark" as Theme,
  );
}

function apply(t: Theme) {
  const el = document.documentElement;
  if (t === "light") el.dataset.theme = "light";
  else delete el.dataset.theme;
  try {
    localStorage.setItem(KEY, t);
  } catch {}
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", t === "light" ? "#f5f5f6" : "#0a0a0b");
  subs.forEach((f) => f());
}

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useTheme();
  const next: Theme = theme === "dark" ? "light" : "dark";

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || reduce) return apply(next);
    // Центр волны — кнопка; радиус — до самого дальнего угла экрана (+ запас на размытый край)
    const r = e.currentTarget.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const max = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 140;
    const root = document.documentElement.style;
    root.setProperty("--lk-x", `${x}px`);
    root.setProperty("--lk-y", `${y}px`);
    root.setProperty("--lk-rmax", `${max}px`);
    const vt = document.startViewTransition(() => flushSync(() => apply(next)));
    // Переход может прерваться (вкладка скрыта, второй клик) — тема всё равно уже применена
    vt.ready.catch(() => {});
    vt.finished.catch(() => {});
  };

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему"}
      title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
      className={cn("press relative grid size-10 place-items-center overflow-hidden rounded-full text-fg-muted hover:bg-surface-2 hover:text-fg", className)}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={theme}
          initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
          transition={springs.soft}
          className="grid"
        >
          {theme === "dark" ? <Moon className="size-[18px]" /> : <Sun className="size-[18px]" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
