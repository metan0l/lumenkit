"use client";

import { Player, Thumbnail } from "@remotion/player";
import { memo, useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { PresetPreviewComp } from "@/presets/compositions";
import { FPS, HEIGHT, WIDTH, getPreset } from "@/presets/registry";

/*
 * Превью пресета — та же Remotion-композиция, что и в монтаже.
 * В покое — статичный кадр (Thumbnail), при наведении/в центре экрана — живой Player.
 */
export const PresetMedia = memo(function PresetMedia({
  presetId,
  playing,
  params,
  className,
}: {
  presetId: string;
  playing: boolean;
  params?: Record<string, unknown>;
  className?: string;
}) {
  const preset = getPreset(presetId);
  // Remotion рендерится только на клиенте: на сервере — скелетон того же размера
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!preset || !mounted) return <div className={cn("skeleton", className)} />;
  const common = {
    component: PresetPreviewComp,
    compositionWidth: WIDTH,
    compositionHeight: HEIGHT,
    fps: FPS,
    durationInFrames: preset.previewFrames,
    inputProps: { presetId, params },
    style: { width: "100%", height: "100%" },
  } as const;

  return (
    <div className={cn("relative overflow-hidden bg-surface", className)}>
      {playing ? (
        <Player {...common} autoPlay loop controls={false} clickToPlay={false} acknowledgeRemotionLicense />
      ) : (
        <Thumbnail {...common} frameToDisplay={preset.posterFrame} />
      )}
    </div>
  );
});
