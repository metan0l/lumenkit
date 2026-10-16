import type { Metadata } from "next";
import { BrandView } from "@/components/brand-view";

export const metadata: Metadata = { title: "Бренд-кит" };

export default function BrandPage() {
  return <BrandView />;
}
