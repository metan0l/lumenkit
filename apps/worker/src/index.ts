import { createDb } from "@lumenkit/db";
import { QUEUES, redisConnection, updateJob, type QueuedJob, type QueueName } from "@lumenkit/jobs";
import { Worker } from "bullmq";
import { processMedia } from "./processors/media";
import { processTranscribe } from "./processors/transcribe";

/*
 * Воркер фоновых задач. Один процесс может держать несколько ролей:
 * WORKER_ROLES=media,ai (по умолчанию все). На проде роли масштабируются отдельными контейнерами.
 */

const db = createDb();

type Progress = (p: number) => Promise<void>;

function runJob(job: QueuedJob, progress: Progress): Promise<Record<string, unknown>> {
  switch (job.type) {
    case "media":
      return processMedia(db, job as QueuedJob<"media">, progress);
    case "transcribe":
      return processTranscribe(db, job as QueuedJob<"transcribe">, progress);
  }
}

/** Сколько задач роль обрабатывает одновременно: ffmpeg грузит CPU, запросы к API — нет */
const concurrency: Record<QueueName, number> = { media: 2, ai: 8 };

const roles = (process.env.WORKER_ROLES ?? Object.values(QUEUES).join(","))
  .split(",")
  .map((r) => r.trim())
  .filter((r): r is QueueName => (Object.values(QUEUES) as string[]).includes(r));

const workers = roles.map(
  (role) =>
    new Worker<QueuedJob>(
      role,
      async (job) => {
        const { jobId } = job.data;
        await updateJob(db, jobId, { status: "running", startedAt: new Date(), error: null });
        const progress: Progress = async (p) => {
          await updateJob(db, jobId, { progress: p });
          await job.updateProgress(p);
        };
        const output = await runJob(job.data, progress);
        await updateJob(db, jobId, { status: "done", progress: 100, output, finishedAt: new Date() });
        return output;
      },
      { connection: redisConnection(), concurrency: concurrency[role] },
    ),
);

for (const w of workers) {
  w.on("failed", async (job, err) => {
    if (!job) return;
    const final = job.attemptsMade >= (job.opts.attempts ?? 1);
    console.error(`[${w.name}] ${job.data.type} ${job.data.jobId} попытка ${job.attemptsMade}: ${err.message}`);
    // Между ретраями задача снова «в очереди», после последней попытки — провал
    await updateJob(db, job.data.jobId, final ? { status: "failed", error: err.message, finishedAt: new Date() } : { status: "queued", error: err.message });
  });
  w.on("completed", (job) => console.log(`[${w.name}] ${job.data.type} ${job.data.jobId} готово`));
}

console.log(`Воркер запущен: ${roles.join(", ")}`);

async function shutdown() {
  await Promise.all(workers.map((w) => w.close()));
  await db.$client.end();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
