import { assets } from "@lumenkit/db";
import { enqueue } from "@lumenkit/jobs";
import { headObject } from "@lumenkit/storage";
import { and, eq } from "drizzle-orm";
import { currentUserId, db } from "@/server/db";

/** Шаг 2 загрузки: файл в S3 — проверяем и ставим обработку в очередь media-воркеру */
export async function POST(_req: Request, ctx: RouteContext<"/api/uploads/[assetId]/complete">) {
  const { assetId } = await ctx.params;
  const userId = await currentUserId();
  const [asset] = await db
    .select()
    .from(assets)
    .where(and(eq(assets.id, assetId), eq(assets.userId, userId)));
  if (!asset) return Response.json({ error: "Загрузка не найдена" }, { status: 404 });
  if (asset.status !== "uploading") return Response.json({ projectId: asset.projectId });

  const object = await headObject(asset.s3Key);
  if (!object) return Response.json({ error: "Файл не дошёл до хранилища — попробуйте ещё раз" }, { status: 409 });

  await db.update(assets).set({ status: "processing", sizeBytes: object.size }).where(eq(assets.id, asset.id));
  await enqueue(db, { type: "media", payload: { assetId: asset.id }, userId, projectId: asset.projectId ?? undefined });
  return Response.json({ projectId: asset.projectId });
}
