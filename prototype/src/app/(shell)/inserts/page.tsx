import type { Metadata } from "next";
import { InsertsView } from "@/components/inserts-view";

export const metadata: Metadata = { title: "Вставки" };

export default function InsertsPage() {
  return <InsertsView />;
}
