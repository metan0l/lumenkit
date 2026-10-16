import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Editor } from "@/components/editor/editor";
import { LogoLoader } from "@/components/brand/animated-logo";
import { projects } from "@/lib/mock";

export function generateStaticParams() {
  return projects.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: projects.find((p) => p.id === id)?.title ?? "Проект" };
}

// Каркас редактора показывается мгновенно при переходе, пока резолвятся params и данные проекта.
export default function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <ProjectEditor params={params} />
    </Suspense>
  );
}

async function ProjectEditor({ params }: { params: PageProps<"/projects/[id]">["params"] }) {
  const { id } = await params;
  const project = projects.find((p) => p.id === id);
  if (!project) notFound();
  return <Editor project={project} />;
}

function EditorSkeleton() {
  return (
    <div className="flex h-dvh flex-col bg-bg" aria-busy="true" aria-label="Открываем проект">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-3">
        <div className="skeleton size-9 rounded-sm" />
        <div className="skeleton h-5 w-56 rounded-xs" />
      </div>
      <div className="flex flex-1 items-center justify-center p-6">
        <LogoLoader label="Открываем проект" />
      </div>
    </div>
  );
}
