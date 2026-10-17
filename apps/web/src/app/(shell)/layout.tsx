import { Suspense } from "react";
import { LogoLoader } from "@/components/brand/animated-logo";
import { AppShell } from "@/components/shell/app-shell";
import { listProjects } from "@/server/projects";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}

async function Shell({ children }: { children: React.ReactNode }) {
  const projects = await listProjects();
  return <AppShell projects={projects}>{children}</AppShell>;
}

function ShellSkeleton() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg" aria-busy="true">
      <LogoLoader label="Загружаем проекты" />
    </div>
  );
}
