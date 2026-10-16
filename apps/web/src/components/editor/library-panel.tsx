"use client";

import { useState } from "react";
import { presetRegistry as presets } from "@/presets/registry";
import type { PresetCategory } from "@/presets/types";
import { CategoryTabs, LibraryCard } from "@/components/preset-library";
import { useEditor } from "./store";

// Библиотека внутри редактора: перетащите пресет в чат или нажмите «+», чтобы прикрепить как пример.
export function LibraryPanel({ initial = "zooms" }: { initial?: PresetCategory }) {
  const ed = useEditor();
  const [cat, setCat] = useState<PresetCategory>(initial);
  const toggle = (id: string) => ed.setAttached((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="px-3 pt-1 pb-2">
        <CategoryTabs value={cat} onChange={setCat} id="editor-lib" size="sm" />
      </div>
      <p className="px-4 pb-3 text-[12px] text-fg-subtle">Перетащите в чат или нажмите «+» — Claude возьмёт как пример.</p>
      <div className="grid min-h-0 flex-1 auto-rows-min grid-cols-2 gap-x-2 gap-y-4 overflow-y-auto px-4 pb-4">
        {presets
          .filter((p) => p.category === cat)
          .map((p) => (
            <LibraryCard key={p.id} preset={p} compact added={ed.attached.includes(p.id)} onAdd={() => toggle(p.id)} />
          ))}
      </div>
    </div>
  );
}
