"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { CircleAlert, CircleCheck, Coins, RotateCcw, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { springs } from "@/lib/motion";

/*
 * Продуманные состояния вместо дефолтных: пустой экран — приглашение к действию,
 * ошибка — что случилось и что делать (без извинений), нехватка кредитов — до начала работы.
 */

export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.soft}
      className={cn("panel-stage flex flex-col items-center rounded-xl px-6 py-12 text-center", className)}
    >
      <span className="relative grid size-14 place-items-center rounded-full bg-surface-2 ring-1 ring-line-strong">
        <span className="lk-halo absolute inset-0 rounded-full bg-accent/25" />
        <Icon className="relative size-6 text-fg-muted" strokeWidth={1.7} />
      </span>
      <h3 className="t-heading mt-5">{title}</h3>
      <p className="t-body mt-1.5 max-w-[42ch]">{text}</p>
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}

export function ErrorState({
  title,
  text,
  refunded,
  onRetry,
  className,
}: {
  title: string;
  text: string;
  /** Сколько кредитов вернули за неудачную операцию */
  refunded?: number;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div role="alert" className={cn("flex items-start gap-3 rounded-md bg-danger/10 p-4 ring-1 ring-danger/25", className)}>
      <CircleAlert className="mt-0.5 size-5 shrink-0 text-danger" />
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-medium">{title}</div>
        <p className="t-meta mt-0.5 text-fg-muted">{text}</p>
        {refunded ? <p className="t-meta mt-1.5 text-success">Вернули {refunded} кр. на баланс</p> : null}
      </div>
      {onRetry && (
        <button onClick={onRetry} className="press flex h-9 shrink-0 items-center gap-1.5 rounded-sm bg-surface-2 px-3 text-[13px] font-medium hover:bg-surface-3">
          <RotateCcw className="size-3.5" /> Повторить
        </button>
      )}
    </div>
  );
}

/** Предупреждение ДО запуска: не на экспорте и не после работы */
export function NoCredits({ need, balance, className }: { need: number; balance: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-md bg-warning/10 p-3 ring-1 ring-warning/25", className)}>
      <Coins className="size-5 shrink-0 text-warning" />
      <p className="min-w-0 flex-1 text-[13px]">
        Нужно <span className="t-num font-medium">{need}</span> кр., на балансе <span className="t-num font-medium">{balance}</span>. Предпросмотр остаётся
        бесплатным.
      </p>
      <Link href="/billing" className="press shrink-0 rounded-sm bg-primary px-3 py-2 text-[13px] font-medium text-primary-fg hover:bg-primary-hover">
        Пополнить
      </Link>
    </div>
  );
}

export function SuccessState({ title, text, className }: { title: string; text: string; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springs.soft}
      className={cn("flex items-start gap-3 rounded-md bg-success/10 p-4 ring-1 ring-success/25", className)}
    >
      <motion.span initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ ...springs.soft, delay: 0.08 }} className="grid">
        <CircleCheck className="size-5 text-success" />
      </motion.span>
      <div>
        <div className="text-[14px] font-medium">{title}</div>
        <p className="t-meta mt-0.5 text-fg-muted">{text}</p>
      </div>
    </motion.div>
  );
}
