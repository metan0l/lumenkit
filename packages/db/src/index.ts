import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export * from "./schema";
export { schema };

export function createDb(url = process.env.DATABASE_URL) {
  if (!url) throw new Error("DATABASE_URL не задан (см. .env.example)");
  return drizzle(postgres(url, { max: 10 }), { schema });
}

/** Тестовый пользователь из seed.ts — пока нет авторизации, API работает от его имени */
export const DEV_USER_ID = "dev-user";

export type Db = ReturnType<typeof createDb>;
