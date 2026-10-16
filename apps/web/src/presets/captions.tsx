import { z } from "zod";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { choice, color, num, toggle } from "./fields";
import { definePreset, type OverlayProps, type TimedWord } from "./types";

/* ---------- Общие параметры и логика страниц слов ---------- */

const FONTS = {
  condensed: "var(--font-oswald), sans-serif",
  wide: "var(--font-unbounded), sans-serif",
  classic: "var(--font-caption-face), sans-serif",
  clean: "var(--font-onest), sans-serif",
} as const;

const fontField = (def: keyof typeof FONTS) =>
  choice("Шрифт", { condensed: "Узкий", wide: "Широкий", classic: "Классика", clean: "Чистый" }, ["condensed", "wide", "classic", "clean"], def);

const captionBase = {
  size: num("Размер", 60, 200, 128, { unit: "px" }),
  color: color("Цвет текста", "#FFFFFF"),
  accent: color("Акцентные слова", "#FFD60A"),
  font: fontField("condensed"),
  position: choice("Позиция", { top: "Верх", center: "Центр", bottom: "Низ" }, ["top", "center", "bottom"], "center"),
  perPage: num("Слов на экране", 1, 5, 2),
  uppercase: toggle("Заглавные", true),
};

const posStyle = (p: "top" | "center" | "bottom"): React.CSSProperties =>
  p === "top"
    ? { justifyContent: "flex-start", paddingTop: "18%" }
    : p === "bottom"
      ? { justifyContent: "flex-end", paddingBottom: "26%" }
      : { justifyContent: "center", paddingTop: "18%" };

/** Текущая «страница» слов и активное слово для кадра */
function usePage(words: TimedWord[], perPage: number) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  let idx = words.findIndex((w) => t >= w.start && t < w.end);
  if (idx < 0) {
    // между словами держим последнее сказанное, пока не началось следующее
    const prev = words.findLastIndex((w) => w.end <= t);
    if (prev < 0 || t - words[prev].end > 0.6) return null;
    idx = prev;
  }
  const start = idx - (idx % perPage);
  return { page: words.slice(start, start + perPage), active: idx - start, t, fps, frame, pageStart: words[start].start };
}

function Layer({ position, size, children }: { position: "top" | "center" | "bottom"; size: number; children: React.ReactNode }) {
  return (
    <AbsoluteFill style={{ alignItems: "center", padding: "0 8%", textAlign: "center", ...posStyle(position) }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "center", gap: `0 ${Math.round(size * 0.22)}px` }}>{children}</div>
    </AbsoluteFill>
  );
}

/* ---------- 1. Удар: слово за словом, пружинный поп, акцент крупнее ---------- */

const impactSchema = z.object({ ...captionBase, tilt: toggle("Наклон акцента", true) });

export const impact = definePreset({
  id: "udar",
  name: "Удар",
  category: "captions",
  tier: "free",
  isNew: true,
  description: "Слова появляются по одному с пружинным «попом», ключевое — крупнее и в цвет акцента.",
  schema: impactSchema,
  demoBg: "studio",
  posterFrame: 66,
  previewFrames: 120,
  defaultSeconds: 0,
  kind: "overlay",
  Component: ({ params: p, words }: OverlayProps<z.infer<typeof impactSchema>>) => {
    const pg = usePage(words, p.perPage);
    if (!pg) return null;
    return (
      <Layer position={p.position} size={p.size}>
        {pg.page.map((w, i) => {
          const local = pg.frame - Math.round(w.start * pg.fps);
          if (local < 0) return null;
          const s = spring({ frame: local, fps: pg.fps, config: { damping: 11, stiffness: 220, mass: 0.6 } });
          return (
            <span
              key={i}
              style={{
                fontFamily: FONTS[p.font],
                fontWeight: 700,
                fontSize: w.emphasis ? p.size * 1.35 : p.size,
                lineHeight: 0.95,
                color: w.emphasis ? p.accent : p.color,
                textTransform: p.uppercase ? "uppercase" : "none",
                scale: interpolate(s, [0, 1], [0.6, 1]),
                rotate: w.emphasis && p.tilt ? "-4deg" : "0deg",
                opacity: interpolate(local, [0, 3], [0, 1], { extrapolateRight: "clamp" }),
                textShadow: "0 6px 0 rgba(0,0,0,0.35)",
              }}
            >
              {w.text}
            </span>
          );
        })}
      </Layer>
    );
  },
});

/* ---------- 2. Караоке: плашка бежит под активным словом ---------- */

const karaokeSchema = z.object({ ...captionBase, perPage: num("Слов на экране", 2, 6, 4), box: color("Цвет плашки", "#3D8BFF") });

export const karaoke = definePreset({
  id: "karaoke",
  name: "Караоке",
  category: "captions",
  tier: "free",
  description: "Вся фраза на экране, плашка подсвечивает слово, которое звучит.",
  schema: karaokeSchema,
  demoBg: "dusk",
  posterFrame: 64,
  previewFrames: 120,
  defaultSeconds: 0,
  kind: "overlay",
  Component: ({ params: p, words }: OverlayProps<z.infer<typeof karaokeSchema>>) => {
    const pg = usePage(words, p.perPage);
    if (!pg) return null;
    return (
      <Layer position={p.position} size={p.size}>
        {pg.page.map((w, i) => (
          <span
            key={i}
            style={{
              fontFamily: FONTS[p.font],
              fontWeight: 800,
              fontSize: p.size * 0.7,
              lineHeight: 1.25,
              padding: "0.05em 0.22em",
              borderRadius: "0.18em",
              color: p.color,
              background: i === pg.active ? p.box : "transparent",
              scale: i === pg.active ? 1.06 : 1,
              textTransform: p.uppercase ? "uppercase" : "none",
              textShadow: i === pg.active ? "none" : "0 3px 12px rgba(0,0,0,0.5)",
            }}
          >
            {w.text}
          </span>
        ))}
      </Layer>
    );
  },
});

/* ---------- 3. Маркер: штрих маркера прорисовывается под активным словом ---------- */

const markerSchema = z.object({ ...captionBase, accent: color("Цвет маркера", "#FF4D8D"), uppercase: toggle("Заглавные", false) });

export const marker = definePreset({
  id: "marker",
  name: "Маркер",
  category: "captions",
  tier: "free",
  description: "Под ключевым словом рисуется штрих текстовыделителя.",
  schema: markerSchema,
  demoBg: "paper",
  posterFrame: 70,
  previewFrames: 120,
  defaultSeconds: 0,
  kind: "overlay",
  Component: ({ params: p, words }: OverlayProps<z.infer<typeof markerSchema>>) => {
    const pg = usePage(words, p.perPage);
    if (!pg) return null;
    return (
      <Layer position={p.position} size={p.size}>
        {pg.page.map((w, i) => {
          const local = pg.frame - Math.round(w.start * pg.fps);
          const draw = interpolate(local, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
          const on = w.emphasis || i === pg.active;
          return (
            <span key={i} style={{ position: "relative", display: "inline-block" }}>
              {on && (
                <span
                  style={{
                    position: "absolute",
                    left: "-0.08em",
                    right: "-0.08em",
                    bottom: "0.08em",
                    height: "0.48em",
                    background: p.accent,
                    borderRadius: "0.12em",
                    transformOrigin: "left",
                    scale: `${draw} 1`,
                    rotate: "-1.5deg",
                  }}
                />
              )}
              <span
                style={{
                  position: "relative",
                  fontFamily: FONTS[p.font === "condensed" ? "classic" : p.font],
                  fontWeight: 800,
                  fontSize: p.size * 0.78,
                  color: p.color === "#FFFFFF" ? "#141414" : p.color,
                  textTransform: p.uppercase ? "uppercase" : "none",
                }}
              >
                {w.text}
              </span>
            </span>
          );
        })}
      </Layer>
    );
  },
});

/* ---------- 4. Неон: свечение с мерцанием на входе ---------- */

const neonSchema = z.object({ ...captionBase, color: color("Цвет неона", "#7AF5FF"), font: fontField("wide") });

export const neon = definePreset({
  id: "neon",
  name: "Неон",
  category: "captions",
  tier: "free",
  description: "Светящийся текст с коротким мерцанием, когда появляется новая фраза.",
  schema: neonSchema,
  demoBg: "city",
  posterFrame: 66,
  previewFrames: 120,
  defaultSeconds: 0,
  kind: "overlay",
  Component: ({ params: p, words }: OverlayProps<z.infer<typeof neonSchema>>) => {
    const pg = usePage(words, p.perPage);
    if (!pg) return null;
    const since = pg.frame - Math.round(pg.pageStart * pg.fps);
    const flicker = since < 8 ? [1, 0.3, 1, 0.5, 1, 1, 0.6, 1][Math.max(0, since)] : 1;
    return (
      <Layer position={p.position} size={p.size}>
        {pg.page.map((w, i) => (
          <span
            key={i}
            style={{
              fontFamily: FONTS[p.font],
              fontWeight: 700,
              fontSize: p.size * 0.66,
              color: "#fff",
              opacity: flicker,
              textTransform: p.uppercase ? "uppercase" : "none",
              textShadow: `0 0 0.08em #fff, 0 0 0.25em ${p.color}, 0 0 0.6em ${p.color}, 0 0 1.2em ${p.color}`,
            }}
          >
            {w.text}
          </span>
        ))}
      </Layer>
    );
  },
});

/* ---------- 5. Капсула: фраза в тёмной капсуле, въезжает пружиной ---------- */

const pillSchema = z.object({ ...captionBase, perPage: num("Слов на экране", 2, 6, 3), bg: color("Фон капсулы", "#111111"), font: fontField("clean"), uppercase: toggle("Заглавные", false) });

export const pill = definePreset({
  id: "kapsula",
  name: "Капсула",
  category: "captions",
  tier: "free",
  description: "Спокойная фраза на тёмной капсуле — читается на любом фоне.",
  schema: pillSchema,
  demoBg: "mint",
  posterFrame: 70,
  previewFrames: 120,
  defaultSeconds: 0,
  kind: "overlay",
  Component: ({ params: p, words }: OverlayProps<z.infer<typeof pillSchema>>) => {
    const pg = usePage(words, p.perPage);
    if (!pg) return null;
    const since = pg.frame - Math.round(pg.pageStart * pg.fps);
    const s = spring({ frame: since, fps: pg.fps, config: { damping: 16, stiffness: 180 } });
    return (
      <Layer position={p.position} size={p.size}>
        <span
          style={{
            display: "inline-flex",
            gap: "0.25em",
            padding: "0.32em 0.7em",
            borderRadius: 999,
            background: p.bg,
            fontFamily: FONTS[p.font],
            fontWeight: 600,
            fontSize: p.size * 0.56,
            color: p.color,
            textTransform: p.uppercase ? "uppercase" : "none",
            translate: `0 ${interpolate(s, [0, 1], [40, 0])}px`,
            opacity: s,
          }}
        >
          {pg.page.map((w, i) => (
            <span key={i} style={{ color: w.emphasis ? p.accent : undefined, opacity: i <= pg.active ? 1 : 0.45 }}>
              {w.text}
            </span>
          ))}
        </span>
      </Layer>
    );
  },
});

/* ---------- 6. Печать: фраза набирается по буквам с курсором ---------- */

const typeSchema = z.object({ ...captionBase, perPage: num("Слов на экране", 2, 6, 4), font: fontField("clean"), uppercase: toggle("Заглавные", false), cursor: toggle("Курсор", true) });

export const typewriter = definePreset({
  id: "pechat",
  name: "Печать",
  category: "captions",
  tier: "free",
  description: "Текст набирается буква за буквой — для спокойных объясняющих роликов.",
  schema: typeSchema,
  demoBg: "studio",
  posterFrame: 100,
  previewFrames: 120,
  defaultSeconds: 0,
  kind: "overlay",
  Component: ({ params: p, words }: OverlayProps<z.infer<typeof typeSchema>>) => {
    const pg = usePage(words, p.perPage);
    if (!pg) return null;
    const full = pg.page.map((w) => w.text).join(" ");
    const since = pg.frame - Math.round(pg.pageStart * pg.fps);
    const chars = Math.min(full.length, Math.floor(since * 1.6));
    const blink = Math.floor(pg.frame / 8) % 2 === 0;
    return (
      <Layer position={p.position} size={p.size}>
        <span
          style={{
            fontFamily: FONTS[p.font],
            fontWeight: 600,
            fontSize: p.size * 0.56,
            color: p.color,
            textTransform: p.uppercase ? "uppercase" : "none",
            textShadow: "0 2px 14px rgba(0,0,0,0.55)",
            whiteSpace: "pre-wrap",
          }}
        >
          {full.slice(0, chars)}
          {p.cursor && <span style={{ opacity: blink ? 1 : 0 }}>▍</span>}
        </span>
      </Layer>
    );
  },
});

/* ---------- 7. Волна: буквы активного слова поднимаются волной ---------- */

const waveSchema = z.object({ ...captionBase, font: fontField("wide"), size: num("Размер", 60, 200, 110, { unit: "px" }) });

export const wave = definePreset({
  id: "volna",
  name: "Волна",
  category: "captions",
  tier: "pro",
  isNew: true,
  description: "Буквы каждого слова поднимаются волной — энергично, но не шумно.",
  schema: waveSchema,
  demoBg: "ember",
  posterFrame: 68,
  previewFrames: 120,
  defaultSeconds: 0,
  kind: "overlay",
  Component: ({ params: p, words }: OverlayProps<z.infer<typeof waveSchema>>) => {
    const pg = usePage(words, p.perPage);
    if (!pg) return null;
    return (
      <Layer position={p.position} size={p.size}>
        {pg.page.map((w, i) => {
          const local = pg.frame - Math.round(w.start * pg.fps);
          if (local < 0) return null;
          return (
            <span key={i} style={{ display: "inline-flex" }}>
              {[...w.text].map((ch, j) => {
                const s = spring({ frame: local - j * 1.5, fps: pg.fps, config: { damping: 12, stiffness: 200 } });
                return (
                  <span
                    key={j}
                    style={{
                      display: "inline-block",
                      fontFamily: FONTS[p.font],
                      fontWeight: 900,
                      fontSize: p.size * 0.62,
                      color: w.emphasis ? p.accent : p.color,
                      textTransform: p.uppercase ? "uppercase" : "none",
                      translate: `0 ${interpolate(s, [0, 1], [0.6, 0])}em`,
                      opacity: s,
                      textShadow: "0 4px 0 rgba(0,0,0,0.3)",
                    }}
                  >
                    {ch}
                  </span>
                );
              })}
            </span>
          );
        })}
      </Layer>
    );
  },
});

/* ---------- 8. Контур: обводка без заливки, активное слово заполняется ---------- */

const outlineSchema = z.object({ ...captionBase, size: num("Размер", 60, 220, 150, { unit: "px" }), perPage: num("Слов на экране", 1, 3, 1) });

export const outline = definePreset({
  id: "kontur",
  name: "Контур",
  category: "captions",
  tier: "pro",
  description: "Крупные контурные буквы; звучащее слово заливается цветом.",
  schema: outlineSchema,
  demoBg: "dusk",
  posterFrame: 66,
  previewFrames: 120,
  defaultSeconds: 0,
  kind: "overlay",
  Component: ({ params: p, words }: OverlayProps<z.infer<typeof outlineSchema>>) => {
    const pg = usePage(words, p.perPage);
    if (!pg) return null;
    return (
      <Layer position={p.position} size={p.size}>
        {pg.page.map((w, i) => {
          const local = pg.frame - Math.round(w.start * pg.fps);
          const fill = interpolate(local, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const c = w.emphasis ? p.accent : p.color;
          return (
            <span
              key={i}
              style={{
                fontFamily: FONTS[p.font],
                fontWeight: 700,
                fontSize: p.size,
                lineHeight: 0.95,
                textTransform: p.uppercase ? "uppercase" : "none",
                WebkitTextStroke: `0.03em ${c}`,
                color: `color-mix(in srgb, ${c} ${Math.round(fill * 100)}%, transparent)`,
              }}
            >
              {w.text}
            </span>
          );
        })}
      </Layer>
    );
  },
});

export const captionPresets = [impact, karaoke, marker, neon, pill, typewriter, wave, outline];
