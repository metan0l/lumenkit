import Link from "next/link";
import { Coins } from "lucide-react";
import { cn } from "@/lib/cn";
import { credits } from "@/lib/mock";

export function CreditsMeter({ collapsed }: { collapsed: boolean }) {
  return (
    <Link
      href="/billing"
      title={collapsed ? `${credits.balance} кредитов` : undefined}
      className={cn("block rounded-sm px-2.5 py-2 hover:bg-surface", collapsed && "grid place-items-center px-0")}
    >
      {collapsed ? (
        <span className="text-[12px] font-medium tabular-nums">{credits.balance}</span>
      ) : (
        <div className="flex items-baseline justify-between">
          <span className="label-mono">Кредиты</span>
          <span className="font-mono text-[13px] tabular-nums">{credits.balance}</span>
        </div>
      )}
    </Link>
  );
}

export function CreditsPill({ className }: { className?: string }) {
  return (
    <Link
      href="/billing"
      className={cn(
        "press inline-flex h-8 items-center gap-1.5 rounded-xs bg-surface-2 px-3 text-[13px] font-medium tabular-nums",
        className,
      )}
    >
      <Coins className="size-3.5 text-fg-muted" />
      {credits.balance}
    </Link>
  );
}
