import {
  ArrowDownLeft,
  ArrowUpRight,
  Barcode,
  CreditCard,
  Landmark,
  QrCode,
  TrendingUp,
} from "lucide-react";
import type { Transaction } from "@/lib/finpay-store";
import { brl, shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const icons = {
  pix: QrCode,
  cartao: CreditCard,
  boleto: Barcode,
  deposito: ArrowDownLeft,
  saque: ArrowUpRight,
  transferencia: Landmark,
  investimento: TrendingUp,
};

export function TransactionRow({ tx, hidden }: { tx: Transaction; hidden?: boolean }) {
  const Icon = icons[tx.kind];
  const incoming = tx.amount > 0;

  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-full",
          incoming ? "bg-accent/15 text-accent" : "bg-secondary text-secondary-foreground",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{tx.title}</p>
        <p className="text-xs text-muted-foreground">{shortDate(tx.date)}</p>
      </div>
      <p
        className={cn(
          "shrink-0 text-sm font-semibold tabular-nums",
          incoming ? "text-accent" : "text-foreground",
        )}
      >
        {hidden ? "••••" : `${incoming ? "+" : "-"} ${brl(Math.abs(tx.amount))}`}
      </p>
    </div>
  );
}
