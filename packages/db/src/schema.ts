import type { Attachment, Block, ChatMessage, GenSpec, Word } from "@lumenkit/core";
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

/* ───────────── Авторизация — схема Better Auth (id текстовые, их выдаёт Better Auth) ───────────── */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

/* ───────────── Проекты и медиа ───────────── */

/** Шортс (автомонтаж) или отдельная вставка */
export const projectKind = pgEnum("project_kind", ["short", "insert"]);
export const projectStatus = pgEnum("project_status", ["draft", "processing", "ready", "rendering"]);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    kind: projectKind("kind").notNull().default("short"),
    title: text("title").notNull(),
    status: projectStatus("status").notNull().default("draft"),
    /** Основной ролик проекта */
    sourceAssetId: uuid("source_asset_id"),
    /** Текущая (принятая) версия таймлайна */
    timelineVersion: integer("timeline_version").notNull().default(0),
    durationSec: real("duration_sec"),
    posterAssetId: uuid("poster_asset_id"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("projects_user_idx").on(t.userId, t.updatedAt)],
);

export const assetKind = pgEnum("asset_kind", ["video", "image", "audio", "file", "render", "generated"]);
export const assetStatus = pgEnum("asset_status", ["uploading", "processing", "ready", "failed"]);

/** Любой файл в S3: исходники, вложения, результаты генераций и рендеров */
export const assets = pgTable(
  "assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    kind: assetKind("kind").notNull(),
    status: assetStatus("status").notNull().default("uploading"),
    /** Ключ в бакете S3 */
    s3Key: text("s3_key").notNull().unique(),
    name: text("name").notNull(),
    mime: text("mime").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }),
    durationSec: real("duration_sec"),
    width: integer("width"),
    height: integer("height"),
    /** ffprobe, превью, прокси и т. п. */
    meta: jsonb("meta").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: createdAt(),
  },
  (t) => [index("assets_project_idx").on(t.projectId), index("assets_user_idx").on(t.userId, t.createdAt)],
);

/** Расшифровка ролика: слова с таймингом (тип Word из @lumenkit/core) */
export const transcripts = pgTable("transcripts", {
  id: uuid("id").primaryKey().defaultRandom(),
  assetId: uuid("asset_id")
    .notNull()
    .unique()
    .references(() => assets.id, { onDelete: "cascade" }),
  language: text("language"),
  provider: text("provider").notNull(),
  words: jsonb("words").$type<Word[]>().notNull(),
  createdAt: createdAt(),
});

/* ───────────── Монтаж ───────────── */

export const timelineSource = pgEnum("timeline_source", ["auto", "chat", "manual"]);

/*
 * Таймлайн хранится версиями: каждая правка режиссёра или ручное сохранение — новая строка.
 * «Принять / откатить» дифф = переключить projects.timeline_version.
 */
export const timelineVersions = pgTable(
  "timeline_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    source: timelineSource("source").notNull(),
    blocks: jsonb("blocks").$type<Block[]>().notNull(),
    /** id вырезанных слов транскрипта */
    cuts: jsonb("cuts").$type<string[]>().notNull().default([]),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("timeline_project_version_uq").on(t.projectId, t.version)],
);

export const messageRole = pgEnum("message_role", ["user", "assistant"]);
export const messageState = pgEnum("message_state", ["pending", "applied", "reverted"]);

type AssistantMessage = Extract<ChatMessage, { role: "assistant" }>;

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    role: messageRole("role").notNull(),
    text: text("text").notNull(),
    /** Стили, упомянутые в сообщении пользователя */
    presets: jsonb("presets").$type<string[]>(),
    files: jsonb("files").$type<Attachment[]>(),
    /** Ответ режиссёра: что поменялось и какие генерации запущены */
    changes: jsonb("changes").$type<NonNullable<AssistantMessage["changes"]>>(),
    gens: jsonb("gens").$type<GenSpec[]>(),
    state: messageState("state"),
    /** Версия таймлайна, которую создал этот ответ */
    timelineVersion: integer("timeline_version"),
    createdAt: createdAt(),
  },
  (t) => [index("chat_project_idx").on(t.projectId, t.createdAt)],
);

/* ───────────── Задачи и генерации ───────────── */

/** Совпадает с ролями воркеров: media / ai / render / gen */
export const jobType = pgEnum("job_type", ["media", "transcribe", "direct", "render", "image", "video"]);
export const jobStatus = pgEnum("job_status", ["queued", "running", "done", "failed", "cancelled"]);

/** Зеркало задачи BullMQ: прогресс для SSE и история для пользователя */
export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
    type: jobType("type").notNull(),
    status: jobStatus("status").notNull().default("queued"),
    /** 0–100 */
    progress: integer("progress").notNull().default(0),
    input: jsonb("input").$type<Record<string, unknown>>().notNull().default({}),
    output: jsonb("output").$type<Record<string, unknown>>(),
    error: text("error"),
    createdAt: createdAt(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (t) => [
    index("jobs_project_idx").on(t.projectId, t.createdAt),
    index("jobs_active_idx").on(t.userId).where(sql`${t.status} in ('queued', 'running')`),
  ],
);

export const genStatus = pgEnum("gen_status", ["queued", "running", "ready", "failed"]);

/** Генерация картинки/видео моделью из реестра (models.ts) */
export const generations = pgTable(
  "generations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
    messageId: uuid("message_id").references(() => chatMessages.id, { onDelete: "set null" }),
    jobId: uuid("job_id").references(() => jobs.id, { onDelete: "set null" }),
    /** id модели из реестра @lumenkit/core */
    model: text("model").notNull(),
    kind: text("kind").$type<GenSpec["kind"]>().notNull(),
    prompt: text("prompt").notNull(),
    /** Claude выбрал модель и написал промпт сам */
    auto: boolean("auto").notNull().default(false),
    refAssetId: uuid("ref_asset_id").references(() => assets.id, { onDelete: "set null" }),
    resultAssetId: uuid("result_asset_id").references(() => assets.id, { onDelete: "set null" }),
    status: genStatus("status").notNull().default("queued"),
    /** Попытки с проверкой результата Claude (лимит 2–3) */
    attempts: integer("attempts").notNull().default(0),
    credits: integer("credits").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("generations_project_idx").on(t.projectId)],
);

/* ───────────── Деньги ───────────── */

/*
 * Каждый запрос к Claude и генеративным API — с первого дня (правило проекта).
 * Отсюда считается реальная себестоимость против цены в кредитах.
 */
export const usageLog = pgTable(
  "usage_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    jobId: uuid("job_id").references(() => jobs.id, { onDelete: "set null" }),
    /** anthropic | google | openai | bytedance | whisper … */
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    /** direct | edit | scene | tags | moderation | image | video | transcribe */
    operation: text("operation").notNull(),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    cacheReadTokens: integer("cache_read_tokens"),
    cacheWriteTokens: integer("cache_write_tokens"),
    /** Штуки для не-токенных API: картинки, секунды видео/аудио */
    units: real("units"),
    costUsd: numeric("cost_usd", { precision: 12, scale: 6 }).notNull(),
    durationMs: integer("duration_ms"),
    requestId: text("request_id"),
    createdAt: createdAt(),
  },
  (t) => [index("usage_user_idx").on(t.userId, t.createdAt), index("usage_created_idx").on(t.createdAt)],
);

export const creditReason = pgEnum("credit_reason", ["purchase", "subscription", "bonus", "charge", "refund"]);

/*
 * Журнал кредитов: баланс = сумма delta. Списание — отрицательная delta.
 * idempotency_key не даёт списать дважды при повторе задачи.
 */
export const creditLedger = pgTable(
  "credit_ledger",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    delta: integer("delta").notNull(),
    reason: creditReason("reason").notNull(),
    jobId: uuid("job_id").references(() => jobs.id, { onDelete: "set null" }),
    note: text("note"),
    idempotencyKey: text("idempotency_key").unique(),
    createdAt: createdAt(),
  },
  (t) => [index("credit_user_idx").on(t.userId, t.createdAt)],
);
