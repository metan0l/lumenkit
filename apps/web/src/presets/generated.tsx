import { Video } from "@remotion/media";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { choice, text } from "./fields";
import { definePreset, type OverlayProps } from "./types";

/*
 * AI-вставка: результат Nano Banana (картинка) или Seedance (видео) поверх ролика.
 * Не показывается в библиотеке — Claude ставит её сам по токену [картинка: …] / [видео: …].
 */

const mediaSchema = z.object({
  src: text("Файл", "/media/gen/img-22.webp"),
  kind: choice("Тип", { image: "Картинка", video: "Видео" }, ["image", "video"], "image"),
  layout: choice("Подача", { full: "На весь кадр", card: "Карточкой" }, ["full", "card"], "full"),
});

export const aiMedia = definePreset({
  id: "ai-media",
  name: "AI-вставка",
  category: "plates",
  tier: "free",
  description: "Картинка или видео, сгенерированные под фразу, с мягким входом и медленным наездом.",
  schema: mediaSchema,
  demoBg: "dusk",
  posterFrame: 30,
  previewFrames: 120,
  defaultSeconds: 3,
  kind: "overlay",
  Component: ({ params: p, durationInFrames }: OverlayProps<z.infer<typeof mediaSchema>>) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const enter = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 14 });
    const exit = interpolate(frame, [durationInFrames - 10, durationInFrames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    // Медленный наезд на всё время блока — картинка «живёт», а не стоит
    const drift = interpolate(frame, [0, durationInFrames], [1.04, 1.14]);
    const media =
      p.kind === "video" ? (
        <Video src={p.src} muted objectFit="cover" style={{ width: "100%", height: "100%" }} />
      ) : (
        <Img src={p.src} style={{ width: "100%", height: "100%", objectFit: "cover", scale: String(drift) }} />
      );

    if (p.layout === "card") {
      return (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: "16%" }}>
          <div
            style={{
              width: "78%",
              aspectRatio: "4 / 5",
              overflow: "hidden",
              borderRadius: 48,
              border: "6px solid rgba(255,255,255,0.9)",
              boxShadow: "0 40px 90px -20px rgba(0,0,0,0.7)",
              translate: `0 ${interpolate(enter, [0, 1], [140, 0]) + exit * 80}px`,
              rotate: `${interpolate(enter, [0, 1], [-6, -2])}deg`,
              opacity: 1 - exit,
            }}
          >
            {media}
          </div>
        </AbsoluteFill>
      );
    }

    return (
      <AbsoluteFill
        style={{
          overflow: "hidden",
          opacity: interpolate(enter, [0, 1], [0, 1]) * (1 - exit),
          filter: `blur(${interpolate(enter, [0, 1], [24, 0])}px)`,
          scale: String(interpolate(enter, [0, 1], [1.12, 1])),
        }}
      >
        {media}
      </AbsoluteFill>
    );
  },
});

export const generatedPresets = [aiMedia];
