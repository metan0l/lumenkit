/*
 * Данные для локальной разработки: тестовый пользователь (пока нет авторизации),
 * стартовые кредиты и демо-проект с первой версией таймлайна. Повторный запуск безопасен.
 */
import { and, eq, sql } from "drizzle-orm";
import { createDb, DEV_USER_ID } from "./index";
import { creditLedger, projects, timelineVersions, user } from "./schema";

try {
  process.loadEnvFile("../../.env");
} catch {}

const db = createDb();

await db
  .insert(user)
  .values({ id: DEV_USER_ID, name: "Разработчик", email: "dev@lumenkit.local", emailVerified: true })
  .onConflictDoNothing();

await db
  .insert(creditLedger)
  .values({ userId: DEV_USER_ID, delta: 240, reason: "bonus", note: "Стартовые кредиты", idempotencyKey: "seed:welcome" })
  .onConflictDoNothing();

let [project] = await db
  .select()
  .from(projects)
  .where(and(eq(projects.userId, DEV_USER_ID), eq(projects.title, "Демо: звуки для монтажа")));

if (!project) {
  [project] = await db
    .insert(projects)
    .values({ userId: DEV_USER_ID, title: "Демо: звуки для монтажа", timelineVersion: 1, durationSec: 46 })
    .returning();
  await db.insert(timelineVersions).values({
    projectId: project.id,
    version: 1,
    source: "auto",
    blocks: [
      { id: "b-c1", track: "captions", start: 0, end: 46, label: "Удар", presetId: "udar" },
      { id: "b-z1", track: "zooms", start: 2.7, end: 3.9, label: "Панч", presetId: "punch" },
      { id: "b-p1", track: "plates", start: 38.5, end: 45, label: "Ссылка на Telegram", presetId: "telegram" },
    ],
  });
}

const [{ balance }] = await db
  .select({ balance: sql<number>`coalesce(sum(${creditLedger.delta}), 0)::int` })
  .from(creditLedger)
  .where(eq(creditLedger.userId, DEV_USER_ID));

console.log(`Пользователь ${DEV_USER_ID}: баланс ${balance} кр., демо-проект ${project.id}`);
await db.$client.end();
