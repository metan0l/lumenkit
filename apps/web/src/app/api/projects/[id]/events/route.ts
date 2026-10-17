import { jobs, projects } from "@lumenkit/db";
import { and, desc, eq } from "drizzle-orm";
import { currentUserId, db } from "@/server/db";

/*
 * Прогресс обработки проекта (SSE). Читаем таблицу jobs раз в секунду — просто и переживает
 * любое число веб-инстансов. Поток закрывается, когда активных задач не осталось.
 */

const TICK_MS = 1000;
const MAX_MS = 10 * 60 * 1000;

export type ProjectEvent = {
  status: (typeof projects.$inferSelect)["status"];
  jobs: { id: string; type: string; status: string; progress: number; error: string | null }[];
  /** Активных задач больше нет — клиенту пора перечитать проект */
  done: boolean;
};

export async function GET(req: Request, ctx: RouteContext<"/api/projects/[id]/events">) {
  const { id } = await ctx.params;
  const userId = await currentUserId();
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)));
  if (!project) return new Response("Not found", { status: 404 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const started = Date.now();
      let last = "";
      while (!req.signal.aborted && Date.now() - started < MAX_MS) {
        const [p] = await db.select({ status: projects.status }).from(projects).where(eq(projects.id, id));
        const rows = await db
          .select({ id: jobs.id, type: jobs.type, status: jobs.status, progress: jobs.progress, error: jobs.error })
          .from(jobs)
          .where(eq(jobs.projectId, id))
          .orderBy(desc(jobs.createdAt))
          .limit(10);
        const done = !rows.some((j) => j.status === "queued" || j.status === "running");
        const event: ProjectEvent = { status: p?.status ?? "draft", jobs: rows, done };
        const payload = JSON.stringify(event);
        if (payload !== last) {
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          last = payload;
        }
        if (done) break;
        await new Promise((r) => setTimeout(r, TICK_MS));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" },
  });
}
