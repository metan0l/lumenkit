import type { Metadata } from "next";
import { PresetsView } from "@/components/presets-view";

export const metadata: Metadata = { title: "Библиотека" };

export default function PresetsPage() {
  return <PresetsView />;
}
