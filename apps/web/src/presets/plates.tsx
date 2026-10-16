import { z } from "zod";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { choice, color, num, text, toggle } from "./fields";
import { definePreset, type OverlayProps } from "./types";

/** Вход пружиной и выход в последние 8 кадров блока */
function useInOut(durationInFrames: number) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 15, stiffness: 170 } });
  const exit = interpolate(frame, [durationInFrames - 8, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  return { frame, fps, enter, exit, visible: enter * (1 - exit) };
}

const vPos = (p: "top" | "bottom"): React.CSSProperties =>
  p === "top" ? { justifyContent: "flex-start", paddingTop: "14%" } : { justifyContent: "flex-end", paddingBottom: "22%" };

const TgIcon = ({ size }: { size: string }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="#fff" aria-hidden>
    <path d="M21.4 4.3 2.9 11.4c-1 .4-1 1.6 0 1.9l4.6 1.5 1.8 5.6c.2.7 1.1.9 1.6.4l2.6-2.4 4.7 3.5c.6.4 1.4.1 1.6-.6l3-15.3c.2-1-.7-1.9-1.4-1.7Z" />
  </svg>
);

/* ---------- 1. Ссылка на Telegram ---------- */

const tgSchema = z.object({
  title: text("Текст", "Все звуки — в моём канале"),
  handle: text("Канал", "@danya_kot"),
  bg: color("Фон", "#FFFFFF"),
  position: choice("Позиция", { top: "Верх", bottom: "Низ" }, ["top", "bottom"], "bottom"),
});

export const tgLink = definePreset({
  id: "telegram",
  name: "Ссылка на Telegram",
  category: "plates",
  tier: "free",
  description: "Карточка канала выезжает снизу и уходит в конце блока.",
  schema: tgSchema,
  demoBg: "studio",
  posterFrame: 40,
  previewFrames: 110,
  defaultSeconds: 4,
  kind: "overlay",
  Component: ({ params: p, durationInFrames }: OverlayProps<z.infer<typeof tgSchema>>) => {
    const { enter, exit } = useInOut(durationInFrames);
    const dark = p.bg.toLowerCase() === "#111111";
    return (
      <AbsoluteFill style={{ alignItems: "center", padding: "0 7%", ...vPos(p.position) }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6em",
            width: "100%",
            padding: "0.7em 0.8em",
            borderRadius: "0.9em",
            background: p.bg,
            color: dark ? "#fff" : "#141414",
            fontFamily: "var(--font-onest), sans-serif",
            fontSize: 54,
            boxShadow: "0 24px 60px -16px rgba(0,0,0,0.55)",
            translate: `0 ${interpolate(enter, [0, 1], [180, 0]) + exit * 120}px`,
            opacity: 1 - exit,
          }}
        >
          <span style={{ display: "grid", placeItems: "center", width: "2.2em", height: "2.2em", borderRadius: "50%", background: "#2AABEE", flex: "none" }}>
            <TgIcon size="1.2em" />
          </span>
          <span style={{ lineHeight: 1.15 }}>
            <span style={{ display: "block", fontWeight: 700 }}>{p.title}</span>
            <span style={{ display: "block", fontSize: "0.72em", opacity: 0.6 }}>{p.handle}</span>
          </span>
        </div>
      </AbsoluteFill>
    );
  },
});

/* ---------- 2. Подписаться: курсор нажимает кнопку ---------- */

const subSchema = z.object({
  label: text("Кнопка", "Подписаться"),
  done: text("После нажатия", "Вы подписаны"),
  accent: color("Цвет кнопки", "#FF3B30"),
  position: choice("Позиция", { top: "Верх", bottom: "Низ" }, ["top", "bottom"], "bottom"),
});

export const subscribe = definePreset({
  id: "podpishis",
  name: "Подписаться",
  category: "plates",
  tier: "free",
  isNew: true,
  description: "Курсор подлетает и нажимает кнопку — кнопка меняется на «Вы подписаны».",
  schema: subSchema,
  demoBg: "dusk",
  posterFrame: 34,
  previewFrames: 100,
  defaultSeconds: 3,
  kind: "overlay",
  Component: ({ params: p, durationInFrames }: OverlayProps<z.infer<typeof subSchema>>) => {
    const { frame, fps, enter, exit } = useInOut(durationInFrames);
    const click = Math.round(fps * 1.1);
    const cursorT = interpolate(frame, [8, click], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
    const press = interpolate(frame, [click, click + 3, click + 7], [1, 0.92, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const done = frame >= click + 2;
    return (
      <AbsoluteFill style={{ alignItems: "center", ...vPos(p.position) }}>
        <div style={{ position: "relative", scale: interpolate(enter, [0, 1], [0.8, 1]) * press, opacity: enter * (1 - exit) }}>
          <div
            style={{
              padding: "0.5em 1.1em",
              borderRadius: 999,
              background: done ? "#2b2b2b" : p.accent,
              color: "#fff",
              fontFamily: "var(--font-onest), sans-serif",
              fontWeight: 700,
              fontSize: 64,
              boxShadow: "0 20px 50px -12px rgba(0,0,0,0.55)",
            }}
          >
            {done ? `✓ ${p.done}` : p.label}
          </div>
          <svg
            viewBox="0 0 24 24"
            width="72"
            height="72"
            style={{
              position: "absolute",
              left: `${interpolate(cursorT, [0, 1], [130, 62])}%`,
              top: `${interpolate(cursorT, [0, 1], [190, 48])}%`,
              filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.4))",
            }}
            aria-hidden
          >
            <path d="M5 3l14 8-6 1.5L10 19z" fill="#fff" stroke="#111" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
        </div>
      </AbsoluteFill>
    );
  },
});

/* ---------- 3. Имя и роль ---------- */

const nameSchema = z.object({
  name: text("Имя", "Даня Кот"),
  role: text("Роль", "моушен-дизайнер"),
  accent: color("Цвет полосы", "#3D8BFF"),
  dark: toggle("Тёмная плашка", true),
});

export const lowerThird = definePreset({
  id: "imya",
  name: "Имя и роль",
  category: "plates",
  tier: "free",
  description: "Классическая подпись спикера: полоса цвета, затем имя и роль.",
  schema: nameSchema,
  demoBg: "studio",
  posterFrame: 45,
  previewFrames: 110,
  defaultSeconds: 4,
  kind: "overlay",
  Component: ({ params: p, durationInFrames }: OverlayProps<z.infer<typeof nameSchema>>) => {
    const { frame, exit } = useInOut(durationInFrames);
    const bar = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
    const txt = interpolate(frame, [6, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
    return (
      <AbsoluteFill style={{ justifyContent: "flex-end", padding: "0 7% 30%", opacity: 1 - exit }}>
        <div style={{ display: "flex", alignItems: "stretch", gap: 18, fontFamily: "var(--font-onest), sans-serif" }}>
          <div style={{ width: 12, borderRadius: 6, background: p.accent, scale: `1 ${bar}`, transformOrigin: "bottom" }} />
          <div
            style={{
              padding: "18px 26px",
              borderRadius: 16,
              background: p.dark ? "rgba(12,12,12,0.82)" : "rgba(255,255,255,0.92)",
              color: p.dark ? "#fff" : "#111",
              clipPath: `inset(0 ${(1 - txt) * 100}% 0 0 round 16px)`,
            }}
          >
            <div style={{ fontSize: 66, fontWeight: 700, lineHeight: 1.1 }}>{p.name}</div>
            <div style={{ fontSize: 42, opacity: 0.65 }}>{p.role}</div>
          </div>
        </div>
      </AbsoluteFill>
    );
  },
});

/* ---------- 4. Стикер-скидка ---------- */

const saleSchema = z.object({
  label: text("Текст", "−50%"),
  note: text("Подпись", "только сегодня"),
  bg: color("Цвет стикера", "#FFD60A"),
  size: num("Размер", 60, 200, 140, { unit: "px" }),
});

export const sale = definePreset({
  id: "skidka",
  name: "Стикер-скидка",
  category: "plates",
  tier: "pro",
  description: "Яркий наклеенный стикер с покачиванием — для офферов и цен.",
  schema: saleSchema,
  demoBg: "mint",
  posterFrame: 30,
  previewFrames: 100,
  defaultSeconds: 3,
  kind: "overlay",
  Component: ({ params: p, durationInFrames }: OverlayProps<z.infer<typeof saleSchema>>) => {
    const { frame, enter, exit } = useInOut(durationInFrames);
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: "30%" }}>
        <div
          style={{
            padding: "0.2em 0.45em 0.25em",
            borderRadius: "0.18em",
            background: p.bg,
            color: "#141414",
            fontFamily: "var(--font-unbounded), sans-serif",
            fontWeight: 900,
            fontSize: p.size,
            lineHeight: 1,
            textAlign: "center",
            boxShadow: "0 30px 60px -20px rgba(0,0,0,0.5)",
            scale: interpolate(enter, [0, 1], [1.8, 1]) * (1 - exit * 0.3),
            rotate: `${-6 + Math.sin(frame / 7) * 2}deg`,
            opacity: interpolate(enter, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }) * (1 - exit),
          }}
        >
          {p.label}
          <div style={{ fontFamily: "var(--font-onest), sans-serif", fontSize: "0.22em", fontWeight: 700, marginTop: "0.2em" }}>{p.note}</div>
        </div>
      </AbsoluteFill>
    );
  },
});

/* ---------- 5. Пуш-уведомление ---------- */

const pushSchema = z.object({
  app: text("Приложение", "Telegram"),
  title: text("Заголовок", "Новое сообщение"),
  body: text("Текст", "Скинь, пожалуйста, исходники 🙏"),
  glass: toggle("Стекло", true),
});

export const push = definePreset({
  id: "push",
  name: "Уведомление",
  category: "plates",
  tier: "free",
  description: "Пуш в стиле iPhone падает сверху — для историй и сторителлинга.",
  schema: pushSchema,
  demoBg: "city",
  posterFrame: 30,
  previewFrames: 100,
  defaultSeconds: 3,
  kind: "overlay",
  Component: ({ params: p, durationInFrames }: OverlayProps<z.infer<typeof pushSchema>>) => {
    const { enter, exit } = useInOut(durationInFrames);
    return (
      <AbsoluteFill style={{ alignItems: "center", padding: "6% 5% 0" }}>
        <div
          style={{
            display: "flex",
            gap: 22,
            width: "100%",
            padding: "26px 28px",
            borderRadius: 40,
            background: p.glass ? "rgba(245,245,245,0.78)" : "#f5f5f5",
            backdropFilter: p.glass ? "blur(20px)" : undefined,
            color: "#111",
            fontFamily: "var(--font-onest), sans-serif",
            boxShadow: "0 20px 50px -20px rgba(0,0,0,0.5)",
            translate: `0 ${interpolate(enter, [0, 1], [-260, 0]) - exit * 260}px`,
          }}
        >
          <span style={{ display: "grid", placeItems: "center", width: 84, height: 84, borderRadius: 20, background: "#2AABEE", flex: "none" }}>
            <TgIcon size="46" />
          </span>
          <span style={{ minWidth: 0, lineHeight: 1.25 }}>
            <span style={{ display: "flex", justifyContent: "space-between", fontSize: 34, opacity: 0.55 }}>
              <span>{p.app}</span>
              <span>сейчас</span>
            </span>
            <span style={{ display: "block", fontSize: 46, fontWeight: 700 }}>{p.title}</span>
            <span style={{ display: "block", fontSize: 42 }}>{p.body}</span>
          </span>
        </div>
      </AbsoluteFill>
    );
  },
});

/* ---------- 6. Сейчас играет ---------- */

const trackSchema = z.object({
  title: text("Трек", "Night Drive"),
  artist: text("Исполнитель", "Lo-Fi Club"),
  accent: color("Цвет", "#34E0A1"),
});

export const nowPlaying = definePreset({
  id: "trek",
  name: "Сейчас играет",
  category: "plates",
  tier: "free",
  description: "Карточка трека с эквалайзером и полосой прогресса.",
  schema: trackSchema,
  demoBg: "ember",
  posterFrame: 50,
  previewFrames: 120,
  defaultSeconds: 5,
  kind: "overlay",
  Component: ({ params: p, durationInFrames }: OverlayProps<z.infer<typeof trackSchema>>) => {
    const { frame, enter, exit } = useInOut(durationInFrames);
    return (
      <AbsoluteFill style={{ justifyContent: "flex-end", padding: "0 6% 24%" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            padding: 24,
            borderRadius: 28,
            background: "rgba(16,16,16,0.86)",
            color: "#fff",
            fontFamily: "var(--font-onest), sans-serif",
            translate: `${interpolate(enter, [0, 1], [-120, 0])}% 0`,
            opacity: 1 - exit,
          }}
        >
          <div style={{ width: 110, height: 110, borderRadius: 18, background: `linear-gradient(135deg, ${p.accent}, #1d1d1d)`, flex: "none" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 50, fontWeight: 700 }}>{p.title}</div>
            <div style={{ fontSize: 38, opacity: 0.6 }}>{p.artist}</div>
            <div style={{ marginTop: 14, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.18)", overflow: "hidden" }}>
              <div style={{ height: "100%", background: p.accent, transformOrigin: "left", scale: `${interpolate(frame, [0, durationInFrames], [0.15, 0.8])} 1` }} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 70 }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ width: 10, borderRadius: 5, background: p.accent, height: `${30 + Math.abs(Math.sin(frame / 4 + i * 1.3)) * 70}%` }} />
            ))}
          </div>
        </div>
      </AbsoluteFill>
    );
  },
});

export const platePresets = [tgLink, subscribe, lowerThird, sale, push, nowPlaying];
