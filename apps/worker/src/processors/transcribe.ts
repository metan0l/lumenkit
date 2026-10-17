import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { transcribe } from "@lumenkit/ai";
import { assets, projects, transcripts, usageLog, type Db } from "@lumenkit/db";
import type { QueuedJob } from "@lumenkit/jobs";
import { downloadToFile } from "@lumenkit/storage";
import { eq } from "drizzle-orm";

type Progress = (p: number) => Promise<void>;

/** Речь ролика → слова с таймингом в transcripts; расход — в usage_log */
export async function processTranscribe(db: Db, job: QueuedJob<"transcribe">, progress: Progress) {
  const [asset] = await db.select().from(assets).where(eq(assets.id, job.payload.assetId));
  const speechKey = asset?.meta.speech as string | undefined;
  if (!asset || !speechKey) throw new Error(`Нет звуковой дорожки для ассета ${job.payload.assetId}`);

  const dir = await mkdtemp(path.join(tmpdir(), "lk-stt-"));
  try {
    const file = path.join(dir, "speech.mp3");
    await downloadToFile(speechKey, file);
    await progress(20);

    const result = await transcribe(await readFile(file), { fileName: "speech.mp3", mime: "audio/mpeg" });
    await progress(90);

    await db.transaction(async (tx) => {
      await tx
        .insert(transcripts)
        .values({ assetId: asset.id, language: result.language, provider: `openrouter:${result.model}`, words: result.words })
        .onConflictDoUpdate({
          target: transcripts.assetId,
          set: { language: result.language, provider: `openrouter:${result.model}`, words: result.words },
        });
      await tx.insert(usageLog).values({
        userId: asset.userId,
        projectId: asset.projectId,
        jobId: job.jobId,
        provider: "openrouter",
        model: result.model,
        operation: "transcribe",
        units: result.usage.seconds,
        costUsd: result.usage.costUsd.toFixed(6),
        durationMs: result.usage.durationMs,
      });
      // Режиссёра ещё нет — после расшифровки проект ждёт правок пользователя
      if (asset.projectId) await tx.update(projects).set({ status: "draft" }).where(eq(projects.id, asset.projectId));
    });
    return { words: result.words.length, model: result.model, costUsd: result.usage.costUsd };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
