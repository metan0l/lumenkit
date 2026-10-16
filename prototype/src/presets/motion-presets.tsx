import { z } from "zod";
import { AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { choice, color, num, text } from "./fields";
import { definePreset, type OverlayProps } from "./types";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* ================= Зумы: трансформация видео внутри блока ================= */

const punchSchema = z.object({ strength: num("Сила", 105, 160, 130, { unit: "%" }), hold: num("Отпускание", 0, 20, 6, { unit: " к." }) });

export const zoomPunch = definePreset({
  id: "punch",
  name: "Панч",
  category: "zooms",
  tier: "free",
  description: "Резкий наезд на акцентном слове и мягкий возврат.",
  schema: punchSchema,
  demoBg: "studio",
  posterFrame: 20,
  previewFrames: 60,
  defaultSeconds: 1.2,
  kind: "wrapper",
  transform: ({ frame, durationInFrames, fps, params }) => {
    const inn = spring({ frame, fps, config: { damping: 18, stiffness: 320 } });
    const out = interpolate(frame, [durationInFrames - params.hold - 4, durationInFrames], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
    return { scale: 1 + (params.strength / 100 - 1) * inn * (1 - out) };
  },
});

const smoothSchema = z.object({ strength: num("Сила", 102, 140, 118, { unit: "%" }), dir: choice("Направление", { in: "Наезд", out: "Отъезд" }, ["in", "out"], "in") });

export const zoomSmooth = definePreset({
  id: "naezd",
  name: "Плавный наезд",
  category: "zooms",
  tier: "free",
  description: "Медленный кинематографичный наезд или отъезд на всю длину блока.",
  schema: smoothSchema,
  demoBg: "dusk",
  posterFrame: 70,
  previewFrames: 90,
  defaultSeconds: 3,
  kind: "wrapper",
  transform: ({ frame, durationInFrames, params }) => {
    const t = interpolate(frame, [0, durationInFrames], [0, 1], { ...clamp, easing: Easing.inOut(Easing.sin) });
    const k = params.dir === "in" ? t : 1 - t;
    return { scale: 1 + (params.strength / 100 - 1) * k };
  },
});

const shakeSchema = z.object({ amount: num("Амплитуда", 2, 40, 14, { unit: "px" }), base: num("Базовый зум", 100, 130, 112, { unit: "%" }) });

export const zoomShake = definePreset({
  id: "tryaska",
  name: "Тряска",
  category: "zooms",
  tier: "pro",
  description: "Удар камеры: короткая тряска с затуханием — для панчлайнов и шуток.",
  schema: shakeSchema,
  demoBg: "ember",
  posterFrame: 8,
  previewFrames: 40,
  defaultSeconds: 0.8,
  kind: "wrapper",
  transform: ({ frame, durationInFrames, params }) => {
    const decay = interpolate(frame, [0, durationInFrames], [1, 0], clamp);
    return {
      scale: params.base / 100,
      x: (random(`x${frame}`) - 0.5) * 2 * params.amount * decay,
      y: (random(`y${frame}`) - 0.5) * 2 * params.amount * decay,
      rotate: (random(`r${frame}`) - 0.5) * 2 * decay,
    };
  },
});

const whipSchema = z.object({ strength: num("Сила", 110, 200, 150, { unit: "%" }), blur: num("Размытие", 0, 24, 10, { unit: "px" }) });

export const zoomWhip = definePreset({
  id: "ryvok",
  name: "Рывок",
  category: "zooms",
  tier: "pro",
  isNew: true,
  description: "Быстрый рывок с размытием движения — как переход внутри одного кадра.",
  schema: whipSchema,
  demoBg: "city",
  posterFrame: 6,
  previewFrames: 40,
  defaultSeconds: 0.6,
  kind: "wrapper",
  transform: ({ frame, durationInFrames, params }) => {
    const t = interpolate(frame, [0, durationInFrames / 2, durationInFrames], [0, 1, 0], { ...clamp, easing: Easing.inOut(Easing.quad) });
    return { scale: 1 + (params.strength / 100 - 1) * t, blur: params.blur * t };
  },
});

export const zoomPresets = [zoomPunch, zoomSmooth, zoomShake, zoomWhip];

/* ================= Переходы: перекрытие в момент склейки ================= */

const wipeSchema = z.object({ color: color("Цвет", "#3D8BFF"), dir: choice("Направление", { left: "Слева", up: "Снизу" }, ["left", "up"], "left") });

export const wipe = definePreset({
  id: "shtorka",
  name: "Шторка",
  category: "transitions",
  tier: "free",
  description: "Цветная шторка закрывает склейку и уходит дальше.",
  schema: wipeSchema,
  demoBg: "mint",
  posterFrame: 15,
  previewFrames: 30,
  defaultSeconds: 0.8,
  kind: "overlay",
  Component: ({ params: p, durationInFrames }: OverlayProps<z.infer<typeof wipeSchema>>) => {
    const frame = useCurrentFrame();
    const t = interpolate(frame, [0, durationInFrames], [-100, 100], { ...clamp, easing: Easing.inOut(Easing.cubic) });
    return <AbsoluteFill style={{ background: p.color, translate: p.dir === "left" ? `${t}% 0` : `0 ${-t}%` }} />;
  },
});

const flashSchema = z.object({ color: color("Цвет", "#FFFFFF"), peak: num("Яркость", 30, 100, 95, { unit: "%" }) });

export const flash = definePreset({
  id: "vspyshka",
  name: "Вспышка",
  category: "transitions",
  tier: "free",
  description: "Короткая вспышка света маскирует склейку.",
  schema: flashSchema,
  demoBg: "dusk",
  posterFrame: 8,
  previewFrames: 30,
  defaultSeconds: 0.6,
  kind: "overlay",
  Component: ({ params: p, durationInFrames }: OverlayProps<z.infer<typeof flashSchema>>) => {
    const frame = useCurrentFrame();
    const o = interpolate(frame, [0, durationInFrames * 0.35, durationInFrames], [0, p.peak / 100, 0], clamp);
    return <AbsoluteFill style={{ background: p.color, opacity: o }} />;
  },
});

const glitchSchema = z.object({ slices: num("Полос", 3, 14, 8), shift: num("Сдвиг", 2, 30, 12, { unit: "%" }) });

export const glitch = definePreset({
  id: "glitch",
  name: "Глитч",
  category: "transitions",
  tier: "pro",
  description: "Цифровые полосы и сдвиг каналов на пару кадров.",
  schema: glitchSchema,
  demoBg: "city",
  posterFrame: 6,
  previewFrames: 30,
  defaultSeconds: 0.5,
  kind: "overlay",
  Component: ({ params: p, durationInFrames }: OverlayProps<z.infer<typeof glitchSchema>>) => {
    const frame = useCurrentFrame();
    const env = interpolate(frame, [0, durationInFrames / 2, durationInFrames], [0, 1, 0], clamp);
    return (
      <AbsoluteFill style={{ mixBlendMode: "screen" }}>
        {Array.from({ length: p.slices }, (_, i) => {
          const r = random(`g${i}-${Math.floor(frame / 2)}`);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: `${r * 100}%`,
                height: `${2 + random(`h${i}`) * 6}%`,
                background: i % 2 ? "rgba(255,0,90,0.55)" : "rgba(0,220,255,0.55)",
                translate: `${(r - 0.5) * p.shift * 2 * env}% 0`,
                opacity: env,
              }}
            />
          );
        })}
      </AbsoluteFill>
    );
  },
});

const irisSchema = z.object({ color: color("Цвет", "#111111") });

export const iris = definePreset({
  id: "krug",
  name: "Круг",
  category: "transitions",
  tier: "free",
  isNew: true,
  description: "Кадр сжимается в круг и раскрывается обратно.",
  schema: irisSchema,
  demoBg: "ember",
  posterFrame: 12,
  previewFrames: 36,
  defaultSeconds: 0.9,
  kind: "overlay",
  Component: ({ params: p, durationInFrames }: OverlayProps<z.infer<typeof irisSchema>>) => {
    const frame = useCurrentFrame();
    const r = interpolate(frame, [0, durationInFrames / 2, durationInFrames], [80, 0, 80], { ...clamp, easing: Easing.inOut(Easing.cubic) });
    return <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, transparent ${r}%, ${p.color} ${r + 0.5}%)` }} />;
  },
});

export const transitionPresets = [wipe, flash, glitch, iris];

/* ================= Хуки: первые секунды ролика ================= */

const questionSchema = z.object({
  text: text("Вопрос", "Ты тоже так делаешь?"),
  accent: color("Акцент", "#FFD60A"),
  size: num("Размер", 60, 160, 108, { unit: "px" }),
});

export const hookQuestion = definePreset({
  id: "vopros",
  name: "Вопрос в лоб",
  category: "hooks",
  tier: "free",
  isNew: true,
  description: "Крупный вопрос сверху на первые секунды — удерживает внимание.",
  schema: questionSchema,
  demoBg: "studio",
  posterFrame: 30,
  previewFrames: 80,
  defaultSeconds: 2.2,
  kind: "overlay",
  Component: ({ params: p, durationInFrames }: OverlayProps<z.infer<typeof questionSchema>>) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const words = p.text.split(" ");
    const out = interpolate(frame, [durationInFrames - 6, durationInFrames], [1, 0], clamp);
    return (
      <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", padding: "16% 8% 0", textAlign: "center", opacity: out }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: `0 ${Math.round(p.size * 0.28)}px` }}>
          {words.map((w, i) => {
            const s = spring({ frame: frame - i * 4, fps, config: { damping: 12, stiffness: 200 } });
            return (
              <span
                key={i}
                style={{
                  fontFamily: "var(--font-unbounded), sans-serif",
                  fontWeight: 900,
                  fontSize: p.size,
                  lineHeight: 1,
                  color: i === words.length - 1 ? p.accent : "#fff",
                  scale: interpolate(s, [0, 1], [0.7, 1]),
                  opacity: s,
                  textShadow: "0 8px 0 rgba(0,0,0,0.3)",
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
    );
  },
});

const progressSchema = z.object({ color: color("Цвет", "#3D8BFF"), height: num("Толщина", 4, 24, 10, { unit: "px" }) });

export const hookProgress = definePreset({
  id: "progress",
  name: "Полоса прогресса",
  category: "hooks",
  tier: "free",
  description: "Тонкая полоса сверху показывает, сколько осталось — люди досматривают.",
  schema: progressSchema,
  demoBg: "mint",
  posterFrame: 60,
  previewFrames: 120,
  defaultSeconds: 0,
  kind: "overlay",
  Component: ({ params: p, durationInFrames }: OverlayProps<z.infer<typeof progressSchema>>) => {
    const frame = useCurrentFrame();
    return (
      <AbsoluteFill>
        <div style={{ height: p.height, background: "rgba(255,255,255,0.2)" }}>
          <div style={{ height: "100%", background: p.color, transformOrigin: "left", scale: `${frame / durationInFrames} 1` }} />
        </div>
      </AbsoluteFill>
    );
  },
});

const countSchema = z.object({
  to: num("До", 10, 1000000, 100000, { step: 1000 }),
  label: text("Подпись", "подписчиков за месяц"),
  accent: color("Цвет", "#34E0A1"),
});

export const hookCounter = definePreset({
  id: "schetchik",
  name: "Счётчик",
  category: "hooks",
  tier: "pro",
  description: "Число быстро набегает до цели — для результатов и кейсов.",
  schema: countSchema,
  demoBg: "city",
  posterFrame: 50,
  previewFrames: 90,
  defaultSeconds: 2.5,
  kind: "overlay",
  Component: ({ params: p, durationInFrames }: OverlayProps<z.infer<typeof countSchema>>) => {
    const frame = useCurrentFrame();
    const v = interpolate(frame, [0, durationInFrames * 0.7], [0, p.to], { ...clamp, easing: Easing.out(Easing.cubic) });
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: "25%", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-unbounded), sans-serif", fontWeight: 900, fontSize: 150, color: p.accent, fontVariantNumeric: "tabular-nums", textShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
          {Math.round(v).toLocaleString("ru-RU")}
        </div>
        <div style={{ fontFamily: "var(--font-onest), sans-serif", fontWeight: 600, fontSize: 44, color: "#fff" }}>{p.label}</div>
      </AbsoluteFill>
    );
  },
});

export const hookPresets = [hookQuestion, hookProgress, hookCounter];
