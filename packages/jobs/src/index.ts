import { jobs, type Db } from "@lumenkit/db";
import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { eq } from "drizzle-orm";

/*
 * Очереди фоновых задач. Задача живёт в двух местах:
 *   - строка в таблице jobs — статус и прогресс для SSE и истории пользователя;
 *   - задача BullMQ в Redis — доставка воркеру, ретраи, конкуренция.
 * Имя очереди = роль воркера, роли масштабируются отдельно (WORKER_ROLES).
 */

export const QUEUES = {
  /** ffprobe, обложка, превью, лента кадров, волна, аудио для расшифровки */
  media: "media",
  /** Запросы к моделям: расшифровка, режиссёр */
  ai: "ai",
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

/** Полезная нагрузка по типу задачи (jobs.type) */
export type JobPayloads = {
  media: { assetId: string };
  transcribe: { assetId: string };
};

export type JobType = keyof JobPayloads;

const queueOf: Record<JobType, QueueName> = { media: QUEUES.media, transcribe: QUEUES.ai };

/** Клиент Redis для BullMQ (в ESM BullMQ принимает только готовый экземпляр) */
export function redisConnection() {
  // Без лимита ретраев на команду — так требует BullMQ для воркеров
  return new Redis(process.env.REDIS_URL ?? "redis://localhost:6380", { maxRetriesPerRequest: null });
}

const queues = new Map<QueueName, Queue>();

export function getQueue(name: QueueName) {
  let q = queues.get(name);
  if (!q) {
    q = new Queue(name, { connection: redisConnection() });
    queues.set(name, q);
  }
  return q;
}

/** Данные задачи BullMQ: id строки jobs + полезная нагрузка */
export type QueuedJob<T extends JobType = JobType> = { jobId: string; type: T; payload: JobPayloads[T] };

/** Создаёт строку jobs и ставит задачу в очередь своей роли */
export async function enqueue<T extends JobType>(
  db: Db,
  args: { type: T; payload: JobPayloads[T]; userId: string; projectId?: string },
) {
  const [row] = await db
    .insert(jobs)
    .values({ type: args.type, userId: args.userId, projectId: args.projectId, input: args.payload })
    .returning({ id: jobs.id });
  const data: QueuedJob<T> = { jobId: row.id, type: args.type, payload: args.payload };
  await getQueue(queueOf[args.type]).add(args.type, data, {
    jobId: row.id,
    attempts: 3,
    backoff: { type: "exponential", delay: 5_000 },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  });
  return row.id;
}

/** Обновление статуса/прогресса задачи из воркера */
export async function updateJob(db: Db, id: string, patch: Partial<typeof jobs.$inferInsert>) {
  await db.update(jobs).set(patch).where(eq(jobs.id, id));
}
