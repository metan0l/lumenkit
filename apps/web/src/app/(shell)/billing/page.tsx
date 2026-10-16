import type { Metadata } from "next";
import { BillingView } from "@/components/billing-view";

export const metadata: Metadata = { title: "Профиль" };

export default function BillingPage() {
  return <BillingView />;
}
