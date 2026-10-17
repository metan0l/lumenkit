// Проект в том виде, в каком его показывают экраны (собирается на сервере из БД — server/projects.ts)

export type ProjectStatus = "ready" | "rendering" | "draft" | "processing";

export type Project = {
  id: string;
  title: string;
  kind: "short" | "insert";
  status: ProjectStatus;
  progress?: number;
  duration: number; // сек
  aspect: "9:16" | "16:9";
  /** Нет, пока воркер не обработал ролик */
  poster?: string;
  preview?: string;
  src: string;
  updated: string;
  style: string;
  /** Лента кадров (1 кадр/с) и волна звука для таймлайна */
  filmstrip?: string;
  wave?: string;
};

export const statusLabel: Record<ProjectStatus, string> = {
  ready: "Готово",
  rendering: "Рендер",
  draft: "Черновик",
  processing: "Распознаём речь",
};

/** 46.4 → «0:46», 59.6 → «1:00» */
export function formatDuration(sec: number) {
  const total = Math.round(sec);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
