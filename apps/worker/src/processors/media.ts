import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { assets, projects, timelineVersions, type AssetMeta, type Db } from "@lumenkit/db";
import { enqueue, type QueuedJob } from "@lumenkit/jobs";
import { downloadToFile, putFile } from "@lumenkit/storage";
import { and, eq } from "drizzle-orm";
import { filmstrip, poster, preview, probe, speechAudio, waveform } from "../ffmpeg";

type Progress = (p: number) => Promise<void>;

/*
 * Загруженный ролик → метаданные и производные файлы для кабинета и таймлайна,
 * первая версия таймлайна (один блок «Ролик») и задача на расшифровку.
 */
export async function processMedia(db: Db, job: QueuedJob<"media">, progress: Progress) {
  const [asset] = await db.select().from(assets).where(eq(assets.id, job.payload.assetId));
  if (!asset) throw new Error(`Нет ассета ${job.payload.assetId}`);

  const dir = await mkdtemp(path.join(tmpdir(), "lk-media-"));
  try {
    const src = path.join(dir, "source" + path.extname(asset.name || ".mp4"));
    await downloadToFile(asset.s3Key, src);
    await progress(15);

    const info = await probe(src);
    const base = asset.s3Key.slice(0, asset.s3Key.lastIndexOf("/"));
    const out = (name: string) => ({ file: path.join(dir, name), key: `${base}/${name}` });
    const meta: AssetMeta = { ...asset.meta };

    const steps: [string, (f: string) => Promise<unknown>, string, keyof AssetMeta][] = [
      ["poster.webp", (f) => poster(src, f, Math.min(1, info.duration / 2)), "image/webp", "poster"],
      ["preview.mp4", (f) => preview(src, f), "video/mp4", "preview"],
      ["filmstrip.jpg", (f) => filmstrip(src, f, info.duration), "image/jpeg", "filmstrip"],
    ];
    if (info.hasAudio) {
      steps.push(["wave.png", (f) => waveform(src, f, info.duration), "image/png", "wave"]);
      steps.push(["speech.mp3", (f) => speechAudio(src, f), "audio/mpeg", "speech"]);
    }
    for (const [i, [name, make, mime, field]] of steps.entries()) {
      const o = out(name);
      await make(o.file);
      await putFile(o.key, o.file, mime);
      meta[field] = o.key;
      await progress(15 + Math.round(((i + 1) / steps.length) * 75));
    }

    await db.transaction(async (tx) => {
      await tx
        .update(assets)
        .set({ status: "ready", durationSec: info.duration, width: info.width, height: info.height, meta })
        .where(eq(assets.id, asset.id));
      if (!asset.projectId) return;
      await tx
        .update(projects)
        .set({
          durationSec: info.duration,
          aspect: info.width < info.height ? "9:16" : "16:9",
          // Без звука расшифровывать нечего — проект сразу готов к правкам
          status: info.hasAudio ? "processing" : "draft",
        })
        .where(eq(projects.id, asset.projectId));
      // Первая версия таймлайна — весь ролик одним блоком; режиссёр соберёт следующую
      const [existing] = await tx
        .select({ id: timelineVersions.id })
        .from(timelineVersions)
        .where(and(eq(timelineVersions.projectId, asset.projectId), eq(timelineVersions.version, 1)));
      if (!existing) {
        await tx.insert(timelineVersions).values({
          projectId: asset.projectId,
          version: 1,
          source: "auto",
          blocks: [{ id: "b-v1", track: "video", start: 0, end: info.duration, label: "Ролик" }],
        });
        await tx.update(projects).set({ timelineVersion: 1 }).where(eq(projects.id, asset.projectId));
      }
    });

    if (info.hasAudio) {
      await enqueue(db, { type: "transcribe", payload: { assetId: asset.id }, userId: asset.userId, projectId: asset.projectId ?? undefined });
    }
    return { duration: info.duration, width: info.width, height: info.height, hasAudio: info.hasAudio };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
