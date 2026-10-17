"use client";

import { createContext, useContext } from "react";
import type { Project } from "@/lib/project";

/** Проекты пользователя из БД — загружаются в layout кабинета (server/projects.ts) */
const ProjectsCtx = createContext<Project[]>([]);

export const ProjectsProvider = ProjectsCtx.Provider;

export function useProjects() {
  return useContext(ProjectsCtx);
}
