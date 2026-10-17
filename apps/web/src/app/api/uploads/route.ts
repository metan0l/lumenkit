import { assets, projects } from "@lumenkit/db";
import { signedPutUrl } from "@lumenkit/storage";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { currentUserId, db } from "@/server/db";

/*
 * Шаг 1 загрузки: создаём проект и ассет, отдаём подписанную ссылку.
 * Файл браузер кладёт в S3 сам (PUT), потом вызывает /api/uploads/[assetId]/complete.
 */

const MAX_BYTES = 1024 * 1024 * 1024; // 1 ГБ — исходник шортса с запасом

const Body = z.object({
  name: z.string().min(1).max(255),
  mime: z.string().regex(/^video\//, "Нужен видеофайл"),
  size: z.number().int().positive().max(MAX_BYTES, "Файл больше 1 ГБ"),
  /** Название проекта; по умолчанию — имя файла без расширения */
  title: z.string().max(120).optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Неверный запрос" }, { status: 400 });
  const { name, mime, size, title } = parsed.data;
  const userId = await currentUserId();

  const ext = (name.match(/\.[a-z0-9]{1,5}$/i)?.[0] ?? ".mp4").toLowerCase();
  const result = await db.transaction(async (tx) => {
    const [project] = await tx
      .insert(projects)
      .values({ userId, title: title?.trim() || name.replace(/\.[^.]+$/, "") || "Новый ролик", status: "processing" })
      .returning({ id: projects.id });
    // Папка с id ассета: рядом воркер положит обложку, превью и прочее
    const assetId = crypto.randomUUID();
    const s3Key = `u/${userId}/${project.id}/${assetId}/source${ext}`;
    await tx.insert(assets).values({ id: assetId, userId, projectId: project.id, kind: "video", status: "uploading", s3Key, name, mime, sizeBytes: size });
    await tx.update(projects).set({ sourceAssetId: assetId }).where(eq(projects.id, project.id));
    return { projectId: project.id, assetId, s3Key };
  });

  return Response.json({
    projectId: result.projectId,
    assetId: result.assetId,
    uploadUrl: await signedPutUrl(result.s3Key, mime),
  });
}
