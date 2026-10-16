import { Video } from "@remotion/media";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { DemoBackground } from "./demo-backgrounds";
import { getPreset, resolveParams } from "./registry";
import type { DemoBg, PresetDef, TimedWord, WrapperPreset } from "./types";

/* ======================= Превью пресета в библиотеке ======================= */

const SAMPLE: [string, boolean?][] = [["Монтаж"], ["это"], ["не"], ["только"], ["визуал,", true], ["но"], ["и"], ["звуки", true]];
const sampleWords = (fps: number, total: number): TimedWord[] => {
  const step = (total / fps - 0.4) / SAMPLE.length;
  return SAMPLE.map(([text, emphasis], i) => ({ text, emphasis, start: 0.2 + i * step, end: 0.2 + (i + 1) * step }));
};

const ALT_BG: Record<DemoBg, DemoBg> = { studio: "dusk", dusk: "city", city: "mint", mint: "ember", paper: "studio", ember: "studio" };

export type PreviewProps = { presetId: string; params?: Record<string, unknown> };

export function PresetPreviewComp({ presetId, params }: PreviewProps) {
  const preset = getPreset(presetId);
  const { fps, durationInFrames } = useVideoConfig();
  if (!preset) return <AbsoluteFill style={{ background: "#111" }} />;
  const p = resolveParams(preset, params);

  if (preset.kind === "wrapper") {
    const from = Math.round(fps * 0.3);
    const len = Math.max(8, Math.round(preset.defaultSeconds * fps));
    return (
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Zoomed blocks={[{ preset, from, len, params: p }]}>
          <DemoBackground variant={preset.demoBg} />
        </Zoomed>
      </AbsoluteFill>
    );
  }

  if (preset.category === "transitions") {
    const len = Math.round(preset.defaultSeconds * fps);
    const mid = Math.round(durationInFrames / 2);
    return (
      <AbsoluteFill>
        <Sequence durationInFrames={mid}>
          <DemoBackground variant={preset.demoBg} />
        </Sequence>
        <Sequence from={mid}>
          <DemoBackground variant={ALT_BG[preset.demoBg]} />
        </Sequence>
        <Sequence from={mid - Math.round(len / 2)} durationInFrames={len}>
          <preset.Component params={p} words={[]} durationInFrames={len} />
        </Sequence>
      </AbsoluteFill>
    );
  }

  const full = preset.defaultSeconds === 0;
  const from = full ? 0 : Math.round(fps * 0.25);
  const len = full ? durationInFrames : Math.min(durationInFrames - from, Math.round(preset.defaultSeconds * fps));
  return (
    <AbsoluteFill>
      <DemoBackground variant={preset.demoBg} />
      <Sequence from={from} durationInFrames={len}>
        <preset.Component params={p} words={sampleWords(fps, durationInFrames)} durationInFrames={len} />
      </Sequence>
    </AbsoluteFill>
  );
}

/* ======================= Зумы: общий контейнер ======================= */

type ZoomBlock = { preset: WrapperPreset; from: number; len: number; params: Record<string, unknown> };

function Zoomed({ blocks, children }: { blocks: ZoomBlock[]; children: React.ReactNode }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const active = blocks.find((b) => frame >= b.from && frame < b.from + b.len);
  const t = active ? active.preset.transform({ frame: frame - active.from, durationInFrames: active.len, fps, params: active.params as never }) : { scale: 1 };
  return (
    <AbsoluteFill
      style={{
        scale: t.scale,
        translate: `${t.x ?? 0}px ${t.y ?? 0}px`,
        rotate: `${t.rotate ?? 0}deg`,
        filter: t.blur ? `blur(${t.blur}px)` : undefined,
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

/* ======================= Шортс в редакторе ======================= */

export type ShortBlock = {
  id: string;
  track: string;
  start: number; // сек исходника
  end: number;
  presetId?: string;
  params?: Record<string, unknown>;
};

export type ShortProps = {
  src: string;
  sourceDuration: number;
  /** Вырезанные куски исходника [начало, конец), сек */
  cuts: [number, number][];
  blocks: ShortBlock[];
  /** Слова в секундах исходника */
  words: TimedWord[];
};

/** Сохранённые куски исходника в порядке воспроизведения */
export function keptSegments(duration: number, cuts: [number, number][]) {
  const sorted = [...cuts].sort((a, b) => a[0] - b[0]);
  const out: [number, number][] = [];
  let cur = 0;
  for (const [a, b] of sorted) {
    if (a > cur) out.push([cur, a]);
    cur = Math.max(cur, b);
  }
  if (cur < duration) out.push([cur, duration]);
  return out;
}

export function srcToOut(t: number, cuts: [number, number][]) {
  let shift = 0;
  for (const [a, b] of cuts) {
    if (t >= b) shift += b - a;
    else if (t > a) shift += t - a;
  }
  return t - shift;
}

export function outToSrc(t: number, cuts: [number, number][], duration: number) {
  let acc = 0;
  for (const [a, b] of keptSegments(duration, cuts)) {
    if (t <= acc + (b - a)) return a + (t - acc);
    acc += b - a;
  }
  return duration;
}

export function outputDuration(duration: number, cuts: [number, number][]) {
  return keptSegments(duration, cuts).reduce((s, [a, b]) => s + (b - a), 0);
}

export function ShortComposition({ src, sourceDuration, cuts, blocks, words }: ShortProps) {
  const { fps } = useVideoConfig();
  const f = (srcT: number) => Math.round(srcToOut(srcT, cuts) * fps);

  const zoomBlocks: ZoomBlock[] = blocks.flatMap((b) => {
    const preset = getPreset(b.presetId);
    if (!preset || preset.kind !== "wrapper") return [];
    return [{ preset, from: f(b.start), len: Math.max(1, f(b.end) - f(b.start)), params: resolveParams(preset, b.params) }];
  });

  let acc = 0;
  const segments = keptSegments(sourceDuration, cuts).map(([a, b]) => {
    const seg = { from: Math.round(acc * fps), len: Math.max(1, Math.round((b - a) * fps)), trim: Math.round(a * fps) };
    acc += b - a;
    return seg;
  });

  const overlays = blocks
    .map((b) => ({ b, preset: getPreset(b.presetId) }))
    .filter((x): x is { b: ShortBlock; preset: PresetDef & { kind: "overlay" } } => !!x.preset && x.preset.kind === "overlay");

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Zoomed blocks={zoomBlocks}>
          {segments.map((s, i) => (
            <Sequence key={i} from={s.from} durationInFrames={s.len} premountFor={fps}>
              <Video src={src} trimBefore={s.trim} objectFit="cover" />
            </Sequence>
          ))}
        </Zoomed>
      </AbsoluteFill>
      {overlays.map(({ b, preset }) => {
        const from = f(b.start);
        const len = Math.max(1, f(b.end) - from);
        const blockWords = words
          .filter((w) => w.end > b.start && w.start < b.end)
          .filter((w) => !cuts.some(([a, c]) => w.start >= a && w.end <= c + 0.001))
          .map((w) => ({ ...w, start: srcToOut(w.start, cuts) - from / fps, end: srcToOut(w.end, cuts) - from / fps }));
        return (
          <Sequence key={b.id} from={from} durationInFrames={len} premountFor={fps}>
            <preset.Component params={resolveParams(preset, b.params)} words={blockWords} durationInFrames={len} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
