/*
 * Данные для локальной разработки: тестовый пользователь (пока нет авторизации),
 * стартовые кредиты и демо-проекты прототипа с медиа в S3. Повторный запуск безопасен.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { putObject } from "@lumenkit/storage";
import { and, eq, sql } from "drizzle-orm";
import { demoChat, demoProjects, demoWords } from "./demo";
import { createDb, DEV_USER_ID } from "./index";
import { assets, chatMessages, creditLedger, jobs, projects, timelineVersions, transcripts, user, type AssetMeta } from "./schema";

try {
  process.loadEnvFile("../../.env");
} catch {}

const MEDIA_DIR = path.resolve("../../apps/web/public/media");
const mimeByExt: Record<string, string> = { ".mp4": "video/mp4", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png" };

const db = createDb();

await db
  .insert(user)
  .values({ id: DEV_USER_ID, name: "Разработчик", email: "dev@lumenkit.local", emailVerified: true })
  .onConflictDoNothing();

await db
  .insert(creditLedger)
  .values({ userId: DEV_USER_ID, delta: 240, reason: "bonus", note: "Стартовые кредиты", idempotencyKey: "seed:welcome" })
  .onConflictDoNothing();

/** Загружает файл из public/media в S3, если он есть; возвращает ключ */
async function upload(slug: string, file: string) {
  const local = path.join(MEDIA_DIR, file);
  if (!existsSync(local)) return undefined;
  const key = `demo/${slug}/${file}`;
  await putObject(key, readFileSync(local), mimeByExt[path.extname(file)]);
  return key;
}

for (const [i, d] of demoProjects.entries()) {
  const [existing] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.userId, DEV_USER_ID), eq(projects.title, d.title)));
  if (existing) continue;

  const updatedAt = new Date(Date.now() - d.updatedAgo * 60_000);
  const meta: AssetMeta = {
    poster: await upload(d.slug, `${d.media}.webp`),
    preview: await upload(d.slug, `${d.media}-preview.mp4`),
    filmstrip: d.filmstrip ? await upload(d.slug, `${d.media}-filmstrip.jpg`) : undefined,
    wave: d.filmstrip ? await upload(d.slug, `${d.media}-wave.png`) : undefined,
  };
  const sourceKey = await upload(d.slug, `${d.media}.mp4`);
  if (!sourceKey) throw new Error(`Нет демо-ролика ${d.media}.mp4 в ${MEDIA_DIR}`);

  await db.transaction(async (tx) => {
    const [project] = await tx
      .insert(projects)
      .values({
        userId: DEV_USER_ID,
        kind: d.kind,
        title: d.title,
        status: d.status,
        timelineVersion: 1,
        durationSec: d.duration,
        aspect: d.aspect,
        createdAt: updatedAt,
        updatedAt,
      })
      .returning();
    const [source] = await tx
      .insert(assets)
      .values({
        userId: DEV_USER_ID,
        projectId: project.id,
        kind: "video",
        status: "ready",
        s3Key: sourceKey,
        name: `${d.media}.mp4`,
        mime: "video/mp4",
        durationSec: d.duration,
        meta,
      })
      .returning();
    await tx.update(projects).set({ sourceAssetId: source.id, updatedAt }).where(eq(projects.id, project.id));
    await tx.insert(timelineVersions).values({ projectId: project.id, version: 1, source: "auto", blocks: d.blocks });

    if (i === 0) {
      await tx.insert(transcripts).values({ assetId: source.id, language: "ru", provider: "demo", words: demoWords });
      for (const [n, m] of demoChat.entries()) {
        await tx.insert(chatMessages).values({
          projectId: project.id,
          role: m.role,
          text: m.text,
          presets: m.role === "user" ? m.presets : undefined,
          changes: m.role === "assistant" ? m.changes : undefined,
          state: m.role === "assistant" ? m.state : undefined,
          // Порядок сообщений — по времени создания
          createdAt: new Date(updatedAt.getTime() + n * 1000),
        });
      }
    }
    if (d.status === "rendering") {
      await tx.insert(jobs).values({
        userId: DEV_USER_ID,
        projectId: project.id,
        type: "render",
        status: "running",
        progress: d.progress ?? 0,
        startedAt: updatedAt,
      });
    }
  });
  console.log(`+ ${d.title}`);
}

const [{ balance }] = await db
  .select({ balance: sql<number>`coalesce(sum(${creditLedger.delta}), 0)::int` })
  .from(creditLedger)
  .where(eq(creditLedger.userId, DEV_USER_ID));

console.log(`Пользователь ${DEV_USER_ID}: баланс ${balance} кр., демо-проектов ${demoProjects.length}`);
await db.$client.end();
