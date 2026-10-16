"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { Palette, Plus, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { costs, credits } from "@/lib/mock";
import { springs } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const packs = [
  { credits: 100, price: 290 },
  { credits: 300, price: 790, note: "Выгоднее на 9%" },
  { credits: 1000, price: 2290, note: "Выгоднее на 21%" },
];

const price = [
  { label: "Автомонтаж шортса до 60 сек", cost: costs.autoEdit },
  { label: "Правка через чат", cost: costs.chatEdit },
  { label: "Смена пресета вручную", cost: 0 },
  { label: "Вставка на пресетах", cost: costs.insert },
  { label: "Вставка с AI-картинкой", cost: costs.insertAi },
  { label: "Рендер и скачивание", cost: costs.render },
];

const history = [
  { what: "Правка: субтитры крупнее", where: "Где брать звуки для монтажа", cost: -1, when: "12 мин назад" },
  { what: "Автомонтаж", where: "BMW в тумане — генерация", cost: -12, when: "40 мин назад" },
  { what: "Вставка", where: "Таймер-циферблат", cost: -3, when: "вчера" },
  { what: "Начисление по тарифу", where: "Креатор", cost: 600, when: "1 октября" },
];

export function BillingView() {
  const [pack, setPack] = useState(1);
  const toast = useToast();
  const share = credits.balance / credits.monthly;
  const enter = (i: number) => ({
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { ...springs.soft, delay: i * 0.06 },
  });

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-12 md:px-10">
      {/* Сцена профиля: кто я, тариф и баланс одним взглядом */}
      <motion.section {...enter(0)} className="panel-stage relative mt-4 overflow-hidden rounded-2xl p-6 md:mt-2 md:p-8">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="lk-drift-a absolute top-[-60%] right-[-10%] size-[70%] rounded-full bg-[radial-gradient(closest-side,var(--glow-a),transparent)]" />
        </div>
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-full bg-accent-soft text-[17px] font-medium text-accent-hover ring-1 ring-accent/40">ДК</span>
            <div>
              <h1 className="t-title">Даня Кот</h1>
              <div className="t-meta mt-1 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-surface-3 px-2 py-0.5 text-fg-muted">Тариф «{credits.plan}»</span>
                <span>начисление {credits.renewsOn}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/brand" className="press inline-flex h-10 items-center gap-2 rounded-full bg-surface-2 px-4 text-[14px] font-medium hover:bg-surface-3">
              <Palette className="size-4" /> Бренд-кит
            </Link>
            <button
              onClick={() => toast({ text: "Прототип: настройки аккаунта" })}
              className="press inline-flex h-10 items-center gap-2 rounded-full px-4 text-[14px] text-fg-muted hover:bg-surface-2 hover:text-fg"
            >
              <Settings className="size-4" /> Аккаунт
            </button>
          </div>
        </div>

        <div className="relative mt-8 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="label-mono">Баланс</div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="t-num text-[56px] leading-none font-medium tracking-[-0.04em] md:text-[72px]">{credits.balance}</span>
              <span className="t-body">из {credits.monthly} кр.</span>
            </div>
            <div className="mt-5 h-1.5 max-w-[520px] overflow-hidden rounded-full bg-surface-3">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: share }}
                transition={{ ...springs.soft, delay: 0.2 }}
                className="h-full origin-left rounded-full bg-[image:var(--accent-grad)]"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6 md:gap-10">
            <Stat value={Math.floor(credits.balance / costs.autoEdit)} label="шортсов" />
            <Stat value={Math.floor(credits.balance / costs.insert)} label="вставок" />
            <Stat value={Math.floor(credits.balance / costs.chatEdit)} label="правок" />
          </div>
        </div>
      </motion.section>

      <div className="mt-4 grid gap-4 md:grid-cols-[1.15fr_1fr]">
        <motion.section {...enter(1)} className="panel rounded-xl p-5 md:p-6">
          <h2 className="t-heading">Пополнить</h2>
          <p className="t-meta mt-1">Кредиты из пакетов не сгорают.</p>
          <div className="mt-4 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Пакет кредитов">
            {packs.map((p, i) => (
              <button
                key={p.credits}
                role="radio"
                aria-checked={pack === i}
                onClick={() => setPack(i)}
                className={cn("press relative rounded-lg bg-surface-2 p-4 text-left transition-colors", pack !== i && "hover:bg-surface-3")}
              >
                {pack === i && (
                  <motion.span
                    layoutId="pack-ring"
                    transition={springs.layout}
                    className="absolute inset-0 rounded-lg ring-1 ring-accent/70 shadow-[0_0_0_4px_var(--accent-soft)]"
                  />
                )}
                <div className="t-num relative text-[22px] font-medium">{p.credits}</div>
                <div className="t-meta t-num relative">{p.price} ₽</div>
                <div className={cn("relative mt-2 h-4 text-[11px]", p.note ? "text-success" : "invisible")}>{p.note ?? "—"}</div>
              </button>
            ))}
          </div>
          <Button variant="primary" size="lg" className="mt-4 w-full justify-center" onClick={() => toast({ text: "Прототип: оплата не подключена" })}>
            Оплатить {packs[pack].price} ₽
          </Button>
          <p className="t-meta mt-2 text-center">Картой или через СБП</p>
        </motion.section>

        <motion.section {...enter(2)} className="panel rounded-xl p-5 md:p-6">
          <h2 className="t-heading">Сколько что стоит</h2>
          <p className="t-meta mt-1">Цена видна на кнопке до нажатия. Предпросмотр бесплатный.</p>
          <ul className="mt-3 flex flex-col">
            {price.map((p) => (
              <li key={p.label} className="flex items-center justify-between border-b border-line py-2.5 text-[14px] last:border-0">
                <span className="text-fg-muted">{p.label}</span>
                <span className={cn("t-num font-medium", p.cost === 0 && "text-success")}>{p.cost === 0 ? "бесплатно" : `${p.cost} кр.`}</span>
              </li>
            ))}
          </ul>
        </motion.section>

        <motion.section {...enter(3)} className="panel rounded-xl p-5 md:col-span-2 md:p-6">
          <h2 className="t-heading">История</h2>
          <ul className="mt-2">
            {history.map((h, i) => (
              <li key={i} className="flex items-center gap-3 border-b border-line py-3 last:border-0">
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-full",
                    h.cost > 0 ? "bg-success/10 text-success" : "bg-surface-2 text-fg-muted",
                  )}
                >
                  {h.cost > 0 ? <Plus className="size-4" /> : <Sparkles className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px]">{h.what}</div>
                  <div className="t-meta truncate">
                    {h.where} · {h.when}
                  </div>
                </div>
                <span className={cn("t-num text-[14px] font-medium", h.cost > 0 ? "text-success" : "text-fg")}>
                  {h.cost > 0 ? `+${h.cost}` : h.cost}
                </span>
              </li>
            ))}
          </ul>
        </motion.section>

        <motion.div {...enter(4)} className="flex flex-col gap-3 px-1 py-2 sm:flex-row sm:items-center sm:justify-between md:col-span-2">
          <p className="t-meta">Подписку можно отменить в один клик — неиспользованные кредиты останутся до конца периода.</p>
          <Button variant="ghost" size="sm" onClick={() => toast({ text: "Прототип: отмена подписки" })}>
            Отменить подписку
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="t-num text-[24px] leading-none font-medium">≈{value}</div>
      <div className="t-meta mt-1.5">{label}</div>
    </div>
  );
}
