"use client";

import type { ProjectEvent } from "@/app/api/projects/[id]/events/route";

/*
 * Загрузка ролика: проект + подписанная ссылка → файл напрямую в S3 → обработка в очереди.
 * Прогресс обработки — SSE /api/projects/[id]/events.
 */

async function api<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Не удалось загрузить ролик");
  return data as T;
}

/** PUT через XHR — у fetch нет прогресса отправки */
function put(url: string, file: File, onProgress: (p: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Хранилище ответило ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("Связь с хранилищем прервалась"));
    xhr.send(file);
  });
}

export async function uploadVideo(file: File, opts: { title?: string; onProgress: (p: number) => void }) {
  const { assetId, uploadUrl } = await api<{ projectId: string; assetId: string; uploadUrl: string }>("/api/uploads", {
    name: file.name,
    mime: file.type || "video/mp4",
    size: file.size,
    title: opts.title,
  });
  await put(uploadUrl, file, opts.onProgress);
  const { projectId } = await api<{ projectId: string }>(`/api/uploads/${assetId}/complete`);
  return projectId;
}

/** Подписка на прогресс обработки; возвращает отписку */
export function watchProject(id: string, onEvent: (e: ProjectEvent) => void) {
  const es = new EventSource(`/api/projects/${id}/events`);
  es.onmessage = (m) => {
    const e = JSON.parse(m.data) as ProjectEvent;
    onEvent(e);
    if (e.done) es.close();
  };
  return () => es.close();
}

/** Обложка и длительность прямо из файла — показываем до загрузки */
export function readVideoFile(file: File) {
  return new Promise<{ poster: string; duration: number }>((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.muted = true;
    v.preload = "metadata";
    v.src = url;
    const done = (poster = "") => {
      URL.revokeObjectURL(url);
      resolve({ poster, duration: Number.isFinite(v.duration) ? v.duration : 0 });
    };
    v.onloadedmetadata = () => (v.currentTime = Math.min(1, v.duration / 2));
    v.onseeked = () => {
      const c = document.createElement("canvas");
      c.width = 360;
      c.height = Math.round((360 * v.videoHeight) / (v.videoWidth || 1));
      c.getContext("2d")?.drawImage(v, 0, 0, c.width, c.height);
      done(c.toDataURL("image/webp", 0.8));
    };
    v.onerror = () => done();
  });
}
