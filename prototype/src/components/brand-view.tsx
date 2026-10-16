"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Check, Upload } from "lucide-react";
import { cn } from "@/lib/cn";
import { springs } from "@/lib/motion";
import { PresetMedia } from "@/components/preset-media";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

/* Цвета бренда — данные пользователя, которые уходят в пресеты, а не цвета интерфейса */
const initialColors = { color: "#FFFFFF", accent: "#3D5BFF", plate: "#7C3AED" };
const colorLabels: Record<keyof typeof initialColors, string> = {
  color: "Текст",
  accent: "Акцент",
  plate: "Плашки",
};

const fonts = [
  { id: "condensed", name: "Oswald", face: "var(--font-oswald)" },
  { id: "classic", name: "Montserrat", face: "var(--font-caption-face)" },
  { id: "wide", name: "Unbounded", face: "var(--font-unbounded)" },
  { id: "clean", name: "Onest", face: "var(--font-onest)" },
] as const;

const previewIds = [
  { id: "udar", label: "Субтитры" },
  { id: "telegram", label: "Плашка" },
] as const;

export function BrandView() {
  const [colors, setColors] = useState(initialColors);
  const [font, setFont] = useState<(typeof fonts)[number]["id"]>("condensed");
  const [preview, setPreview] = useState<(typeof previewIds)[number]["id"]>("udar");
  const [sign, setSign] = useState({ name: "Даня Кот", role: "моушен-дизайнер", link: "t.me/danya_kot" });
  const toast = useToast();

  const enter = (i: number) => ({
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { ...springs.soft, delay: i * 0.06 },
  });

  const params = preview === "udar" ? { color: colors.color, accent: colors.accent, font } : { handle: `@${sign.link.split("/").pop() || sign.name}` };

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-12 md:px-10">
      <motion.header {...enter(0)} className="flex flex-col gap-4 pt-6 pb-6 sm:flex-row sm:items-end sm:justify-between md:pt-2">
        <div>
          <h1 className="t-title">Бренд-кит</h1>
          <p className="t-body mt-2 max-w-[56ch]">Цвета, шрифт и подписи, которые Claude подставляет в каждый пресет. Справа — как это выглядит в ролике.</p>
        </div>
        <Button variant="primary" onClick={() => toast({ text: "Бренд-кит сохранён — применится к новым монтажам" })}>
          <Check /> Сохранить
        </Button>
      </motion.header>

      <div className="grid gap-4 md:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <motion.section {...enter(1)} className="panel rounded-xl p-5 md:p-6">
            <h2 className="t-heading">Цвета</h2>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {(Object.keys(colors) as (keyof typeof colors)[]).map((k) => (
                <label key={k} className="press group relative cursor-pointer rounded-lg bg-surface-2 p-3 hover:bg-surface-3">
                  <span className="block h-14 rounded-md ring-1 ring-line-strong" style={{ background: colors[k] }} />
                  <span className="mt-2.5 block text-[14px] font-medium">{colorLabels[k]}</span>
                  <span className="t-meta t-num block uppercase">{colors[k]}</span>
                  <input
                    type="color"
                    value={colors[k]}
                    onChange={(e) => setColors((c) => ({ ...c, [k]: e.target.value.toUpperCase() }))}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    aria-label={`Цвет: ${colorLabels[k]}`}
                  />
                </label>
              ))}
            </div>
          </motion.section>

          <motion.section {...enter(2)} className="panel rounded-xl p-5 md:p-6">
            <h2 className="t-heading">Шрифт субтитров</h2>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Шрифт субтитров">
              {fonts.map((f) => (
                <button
                  key={f.id}
                  role="radio"
                  aria-checked={font === f.id}
                  onClick={() => setFont(f.id)}
                  className={cn("press relative rounded-lg bg-surface-2 p-4 text-left", font !== f.id && "hover:bg-surface-3")}
                >
                  {font === f.id && (
                    <motion.span
                      layoutId="font-ring"
                      transition={springs.layout}
                      className="absolute inset-0 rounded-lg ring-1 ring-accent/70 shadow-[0_0_0_4px_var(--accent-soft)]"
                    />
                  )}
                  <span className="relative block text-[24px] leading-none font-semibold uppercase" style={{ fontFamily: f.face }}>
                    Привет
                  </span>
                  <span className="t-meta relative mt-2 block">{f.name}</span>
                </button>
              ))}
            </div>
          </motion.section>

          <motion.section {...enter(3)} className="panel rounded-xl p-5 md:p-6">
            <h2 className="t-heading">Подписи и ссылки</h2>
            <p className="t-meta mt-1">Попадают в плашки с именем и финальные титры.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {(
                [
                  ["name", "Имя"],
                  ["role", "Роль"],
                  ["link", "Ссылка"],
                ] as const
              ).map(([k, label]) => (
                <label key={k} className="block">
                  <span className="t-meta">{label}</span>
                  <input
                    value={sign[k]}
                    onChange={(e) => setSign((s) => ({ ...s, [k]: e.target.value }))}
                    className="focus-glow mt-1.5 h-11 w-full rounded-md bg-surface-2 px-3 text-[14px] outline-none"
                  />
                </label>
              ))}
            </div>
          </motion.section>

          <motion.section {...enter(4)} className="panel flex items-center gap-4 rounded-xl p-5 md:p-6">
            <span className="grid size-12 shrink-0 place-items-center rounded-md bg-surface-2 ring-1 ring-line-strong">
              <Upload className="size-5 text-fg-muted" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="t-heading">Логотип</h2>
              <p className="t-meta mt-0.5">PNG или SVG с прозрачным фоном — для водяного знака и финальной плашки.</p>
            </div>
            <Button size="sm" onClick={() => toast({ text: "Прототип: загрузка логотипа" })}>
              Загрузить
            </Button>
          </motion.section>
        </div>

        <motion.aside {...enter(2)} className="md:sticky md:top-6 md:self-start">
          <div className="panel-stage rounded-xl p-3">
            <div className="mb-3 flex gap-1 rounded-full bg-surface-2 p-1">
              {previewIds.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPreview(p.id)}
                  className={cn("relative h-8 flex-1 rounded-full text-[13px] font-medium", preview === p.id ? "text-fg" : "text-fg-subtle hover:text-fg-muted")}
                >
                  {preview === p.id && <motion.span layoutId="brand-prev" transition={springs.layout} className="absolute inset-0 rounded-full bg-surface-3" />}
                  <span className="relative">{p.label}</span>
                </button>
              ))}
            </div>
            <PresetMedia key={preview} presetId={preview} params={params} playing className="aspect-[9/16] rounded-lg" />
          </div>
          <p className="t-meta mt-2 text-center">Живой предпросмотр — меняется вместе с настройками</p>
        </motion.aside>
      </div>
    </div>
  );
}
