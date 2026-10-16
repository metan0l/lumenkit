import type { Metadata } from "next";
import { UiKit } from "./ui-kit";

export const metadata: Metadata = { title: "UI-кит" };

export default function UiKitPage() {
  return <UiKit />;
}
