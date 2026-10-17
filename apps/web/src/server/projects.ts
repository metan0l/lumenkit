import "server-only";
import type { Block, ChatMessage, Word } from "@lumenkit/core";
import { assets, chatMessages, jobs, projects, timelineVersions, transcripts, type AssetMeta } from "@lumenkit/db";
import { signedGetUrl } from "@lumenkit/storage";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { connection } from "next/server";
import type { Project } from "@/lib/project";
import { currentUserId, db } from "./db";

type Row = {
  project: typeof projects.$inferSelect;
  source: typeof assets.$inferSelect | null;
  timeline: typeof timelineVersions.$inferSelect | null;
};

const signed = (key?: string) => (key ? signedGetUrl(key) : undefined);

/** Подпись стиля на карточке: первые субтитры, иначе первый стиль на таймлайне */
function styleOf(blocks: Block[] = []) {
  return (blocks.find((b) => b.track === "captions") ?? blocks.find((b) => b.presetId))?.label ?? "Без стиля";
}

const rtf = new Intl.RelativeTimeFormat("ru", { numeric: "auto" });

function ago(d: Date) {
  const min = Math.round((Date.now() - d.getTime()) / 60_000);
  if (min < 1) return "только что";
  if (min < 60) return rtf.format(-min, "minute");
  if (min < 60 * 24) return rtf.format(-Math.round(min / 60), "hour");
  return rtf.format(-Math.round(min / (60 * 24)), "day");
}

async function toView({ project: p, source, timeline }: Row, progress?: number): Promise<Project> {
  const meta: AssetMeta = source?.meta ?? {};
  const [src, poster, preview, filmstrip, wave] = await Promise.all([
    signed(source?.s3Key),
    signed(meta.poster),
    signed(meta.preview),
    signed(meta.filmstrip),
    signed(meta.wave),
  ]);
  return {
    id: p.id,
    title: p.title,
    kind: p.kind,
    status: p.status,
    progress,
    duration: p.durationSec ?? source?.durationSec ?? 0,
    aspect: p.aspect,
    src: src ?? "",
    poster: poster ?? "",
    preview: preview ?? src ?? "",
    filmstrip,
    wave,
    updated: ago(p.updatedAt),
    style: styleOf(timeline?.blocks),
  };
}

function baseQuery() {
  return db
    .select({ project: projects, source: assets, timeline: timelineVersions })
    .from(projects)
    .leftJoin(assets, eq(assets.id, projects.sourceAssetId))
    .leftJoin(
      timelineVersions,
      and(eq(timelineVersions.projectId, projects.id), eq(timelineVersions.version, projects.timelineVersion)),
    );
}

/** Прогресс активных рендеров по проектам */
async function renderProgress(projectIds: string[]) {
  if (!projectIds.length) return new Map<string, number>();
  const rows = await db
    .select({ projectId: jobs.projectId, progress: jobs.progress })
    .from(jobs)
    .where(and(inArray(jobs.projectId, projectIds), eq(jobs.type, "render"), inArray(jobs.status, ["queued", "running"])));
  return new Map(rows.map((r) => [r.projectId!, r.progress]));
}

export async function listProjects(): Promise<Project[]> {
  await connection();
  const userId = await currentUserId();
  const rows = await baseQuery().where(eq(projects.userId, userId)).orderBy(desc(projects.updatedAt));
  const progress = await renderProgress(rows.map((r) => r.project.id));
  return Promise.all(rows.map((r) => toView(r, progress.get(r.project.id))));
}

export type ProjectData = {
  project: Project;
  version: number;
  blocks: Block[];
  cuts: string[];
  words: Word[];
  chat: ChatMessage[];
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Всё, что нужно редактору: проект, текущая версия таймлайна, транскрипт и чат */
export async function getProject(id: string): Promise<ProjectData | undefined> {
  await connection();
  if (!UUID_RE.test(id)) return undefined;
  const userId = await currentUserId();
  const [row] = await baseQuery().where(and(eq(projects.id, id), eq(projects.userId, userId)));
  if (!row) return undefined;

  const [progress, transcript, messages] = await Promise.all([
    renderProgress([id]),
    row.source
      ? db.select({ words: transcripts.words }).from(transcripts).where(eq(transcripts.assetId, row.source.id))
      : Promise.resolve([]),
    db.select().from(chatMessages).where(eq(chatMessages.projectId, id)).orderBy(asc(chatMessages.createdAt)),
  ]);

  const chat: ChatMessage[] = messages.map((m) =>
    m.role === "user"
      ? { id: m.id, role: "user", text: m.text, presets: m.presets ?? undefined, files: m.files ?? undefined }
      : { id: m.id, role: "assistant", text: m.text, changes: m.changes ?? undefined, gens: m.gens ?? undefined, state: m.state ?? undefined },
  );

  return {
    project: await toView(row, progress.get(id)),
    version: row.project.timelineVersion,
    blocks: row.timeline?.blocks ?? [],
    cuts: row.timeline?.cuts ?? [],
    words: transcript[0]?.words ?? [],
    chat,
  };
}
