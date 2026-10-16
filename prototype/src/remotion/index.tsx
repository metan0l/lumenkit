/*
 * Точка входа для серверного рендера (npx remotion render).
 * Та же композиция шортса, что в Player редактора; шрифты грузятся через
 * @remotion/google-fonts и пробрасываются в CSS-переменные, которые используют пресеты.
 */
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadOnest } from "@remotion/google-fonts/Onest";
import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";
import { loadFont as loadUnbounded } from "@remotion/google-fonts/Unbounded";
import { AbsoluteFill, Composition, registerRoot, staticFile } from "remotion";
import { ShortComposition, outputDuration, type ShortProps } from "@/presets/compositions";
import { FPS, HEIGHT, WIDTH } from "@/presets/registry";

const subsets = { subsets: ["latin", "cyrillic"] as ("latin" | "cyrillic")[] };
const fonts = {
  "--font-oswald": loadOswald("normal", { weights: ["700"], ...subsets }).fontFamily,
  "--font-onest": loadOnest("normal", { weights: ["500", "600", "700"], ...subsets }).fontFamily,
  "--font-unbounded": loadUnbounded("normal", { weights: ["700", "900"], ...subsets }).fontFamily,
  "--font-caption-face": loadMontserrat("normal", { weights: ["800", "900"], ...subsets }).fontFamily,
};

function RenderShort(props: ShortProps) {
  // Локальные файлы из public/ передаются как "/input/clip.mp4"
  const src = props.src.startsWith("/") ? staticFile(props.src.slice(1)) : props.src;
  return (
    <AbsoluteFill style={fonts as React.CSSProperties}>
      <ShortComposition {...props} src={src} />
    </AbsoluteFill>
  );
}

const defaults: ShortProps = { src: "/media/v2.mp4", sourceDuration: 10, cuts: [], blocks: [], words: [] };

function Root() {
  return (
    <Composition
      id="Short"
      component={RenderShort}
      width={WIDTH}
      height={HEIGHT}
      fps={FPS}
      durationInFrames={FPS * 10}
      defaultProps={defaults}
      calculateMetadata={({ props }) => ({
        durationInFrames: Math.max(1, Math.round(outputDuration(props.sourceDuration, props.cuts) * FPS)),
      })}
    />
  );
}

registerRoot(Root);
