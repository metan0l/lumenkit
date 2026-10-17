"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";
import { statusLabel, type Project } from "@/lib/project";
import { usePreviewPlay } from "@/lib/use-preview-play";
import { useMockProgress } from "@/components/shell/queue-indicator";

export function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ProjectCard({ project, priority = false }: { project: Project; priority?: boolean }) {
  const { ref, playing, bind } = usePreviewPlay<HTMLAnchorElement>();
  const video = useRef<HTMLVideoElement>(null);
  const rendering = project.status === "rendering";
  const progress = useMockProgress(project.progress ?? 0);
  // Прокрутка кадров мышью: позиция курсора = момент ролика (как в Frame.io / YouTube)
  const [scrub, setScrub] = useState<number | null>(null);
  const onScrub = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const v = video.current;
    const r = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    setScrub(ratio);
    if (v && v.readyState >= 1 && Number.isFinite(v.duration)) {
      v.pause();
      v.currentTime = ratio * v.duration;
    }
  };

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (playing) {
      if (!v.src) v.src = project.preview;
      v.currentTime = 0;
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [playing, project.preview]);

  return (
    <Link ref={ref} href={`/projects/${project.id}`} className="lift group block rounded-md outline-offset-4" {...bind}>
      <div
        className="relative aspect-[9/16] overflow-hidden rounded-md bg-surface ring-1 ring-line transition-[box-shadow] duration-200 group-hover:ring-line-strong"
        onPointerMove={onScrub}
        onPointerLeave={() => setScrub(null)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={project.poster}
          alt=""
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className={cn(
            "absolute inset-0 size-full transition-transform duration-300 ease-[var(--ease-out)] group-hover:scale-[1.02]",
            project.aspect === "16:9" ? "object-contain" : "object-cover",
          )}
        />
        <video
          ref={video}
          muted
          playsInline
          loop
          preload="none"
          className={cn(
            "absolute inset-0 size-full transition-opacity duration-200",
            project.aspect === "16:9" ? "object-contain" : "object-cover",
            playing ? "opacity-100" : "opacity-0",
          )}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-2">
          <StatusChip project={project} progress={progress} />
          {project.kind === "insert" && (
            <span className="rounded-xs bg-bg/80 px-1.5 py-1 font-mono text-[11px] text-fg-muted">Вставка 16:9</span>
          )}
        </div>
        <span className="absolute right-2 bottom-2 rounded-xs bg-bg/80 px-1.5 py-1 font-mono text-[11px] tabular-nums">
          {formatDuration(project.duration)}
        </span>
        {scrub !== null && playing && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-bg/50">
            <div className="h-full origin-left bg-fg" style={{ transform: `scaleX(${scrub})` }} />
          </div>
        )}
        {rendering && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-bg/60">
            <div
              className="h-full origin-left bg-accent transition-transform duration-700 ease-[var(--ease-out)]"
              style={{ transform: `scaleX(${progress / 100})` }}
            />
          </div>
        )}
      </div>
      <div className="mt-2.5 flex items-start gap-2 px-0.5">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-medium tracking-[-0.01em]">{project.title}</div>
          <div className="t-meta mt-0.5 truncate">
            {project.style} · {project.updated}
          </div>
        </div>
        <span
          role="button"
          tabIndex={-1}
          aria-label="Действия с проектом"
          className="grid size-7 place-items-center rounded-sm text-fg-subtle opacity-0 group-hover:opacity-100 hover:bg-surface-2 hover:text-fg"
          onClick={(e) => e.preventDefault()}
        >
          <MoreHorizontal className="size-4" />
        </span>
      </div>
    </Link>
  );
}

function StatusChip({ project, progress }: { project: Project; progress: number }) {
  if (project.status === "ready") return <span />;
  if (project.status === "rendering")
    return (
      <span className="flex h-6 items-center gap-1.5 rounded-xs bg-bg/85 px-2 font-mono text-[11px] tabular-nums">
        <span className="pulse-dot" /> Рендер {progress}%
      </span>
    );
  return (
    <span className="flex h-6 items-center rounded-xs bg-bg/85 px-2 font-mono text-[11px] text-fg-muted">
      {statusLabel[project.status]}
    </span>
  );
}
