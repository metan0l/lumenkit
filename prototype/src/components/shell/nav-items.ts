import { Clapperboard, Home, Layers, Sparkles, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; match: (p: string) => boolean };

export const navItems: NavItem[] = [
  { href: "/", label: "Создать", icon: Home, match: (p) => p === "/" },
  { href: "/projects", label: "Проекты", icon: Clapperboard, match: (p) => p.startsWith("/projects") },
  { href: "/presets", label: "Библиотека", icon: Layers, match: (p) => p.startsWith("/presets") },
  { href: "/inserts", label: "Вставки", icon: Sparkles, match: (p) => p.startsWith("/inserts") },
];
