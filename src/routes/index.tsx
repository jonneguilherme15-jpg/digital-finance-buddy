import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Barcode,
  Bell,
  Eye,
  EyeOff,
  QrCode,
  Send,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { useFinPay } from "@/lib/finpay-store";
import { brl } from "@/lib/format";
import { TransactionRow } from "@/components/finpay/TransactionRow";
import { AmountDialog } from "@/components/finpay/AmountDialog";
import { EmptyState } from "@/components/finpay/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FinPay — Sua carteira digital" },
      {
        name: "description",
        content: "Veja saldo, últimas transações e o resumo do mês na sua conta FinPay.",
      },
      { property: "og:title", content: "FinPay — Sua carteira digital" },
      {
        property: "og:description",
        content: "Saldo, Pix, cartões e resumo financeiro do mês em um só lugar.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const {
    balance,
    hideBalance,
    toggleHideBalance,
    transactions,
    moveMoney,
    unreadCount,
  } = useFinPay();

  const now = new Date();
  const monthTx = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const income = monthTx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expenses = monthTx.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <div>
      <section className="gradient-hero px-5 pb-16 pt-8 text-primary-foreground">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <p className="text-sm text-primary-foreground/70">Boa tarde,</p>
            <h1 className="truncate text-xl font-bold">Jone Guilherme</h1>
          </div>
          <Link
            to="/notificacoes"
            className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-foreground/10"
            aria-label="Notificações"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                {unreadCount}
              </span>
            ) : null}
          </Link>
        </div>

        <div className="mt-8">
          <div className="flex items-center gap-2 text-sm text-primary-foreground/70">
            Saldo disponível
            <button onClick={toggleHideBalance} aria-label="Ocultar saldo">
              {hideBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1 text-4xl font-bold tabular-nums">
            {hideBalance ? "R$ ••••••" : brl(balance)}
          </p>
        </div>
      </section>

      <div className="-mt-10 px-5">
        <div className="surface-card grid grid-cols-5 gap-1 p-3">
          <QuickAction to="/pix" icon={QrCode} label="Pix" />
          <AmountDialog
            title="Transferir"
            description="Transferência TED para conta cadastrada (demo)."
            max={balance}
            onConfirm={(a) => {
              moveMoney({ kind: "transferencia", amount: a, title: "Transferência enviada" });
              toast.success("Transferência concluída!");
            }}
            trigger={<QuickActionButton icon={Send} label="Transferir" />}
          />
          <QuickAction to="/pagamentos" icon={Barcode} label="Pagar" />
          <AmountDialog
            title="Depositar"
            description="Depósito por boleto gerado na hora (demo)."
            onConfirm={(a) => {
              moveMoney({ kind: "deposito", amount: a, title: "Depósito recebido" });
              toast.success("Depósito confirmado!");
            }}
            trigger={<QuickActionButton icon={ArrowDownToLine} label="Depositar" />}
          />
          <AmountDialog
            title="Sacar"
            description="Saque em caixas da rede parceira (demo)."
            max={balance}
            onConfirm={(a) => {
              moveMoney({ kind: "saque", amount: a, title: "Saque realizado" });
              toast.success("Código de saque gerado!");
            }}
            trigger={<QuickActionButton icon={ArrowUpFromLine} label="Sacar" />}
          />
        </div>
      </div>

      <section className="px-5 pt-6">
        <h2 className="text-sm font-semibold text-foreground">Resumo de {now.toLocaleDateString("pt-BR", { month: "long" })}</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <SummaryCard label="Entradas" value={income} tone="in" hidden={hideBalance} />
          <SummaryCard label="Saídas" value={expenses} tone="out" hidden={hideBalance} />
        </div>
        <div className="surface-card mt-3 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Resultado do mês</span>
            <span className="font-semibold tabular-nums text-foreground">
              {hideBalance ? "••••" : brl(income - expenses)}
            </span>
          </div>
          <Link to="/financas" className="mt-3 block">
            <Button variant="secondary" className="w-full">
              Ver controle financeiro
            </Button>
          </Link>
        </div>
      </section>

      <section className="px-5 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Últimas transações</h2>
          <Link to="/financas" className="text-xs font-medium text-accent">
            Ver todas
          </Link>
        </div>
        <div className="surface-card mt-3 divide-y divide-border px-4">
          {transactions.slice(0, 6).map((tx) => (
            <TransactionRow key={tx.id} tx={tx} hidden={hideBalance} />
          ))}
        </div>
        {transactions.length === 0 ? (
          <div className="mt-3">
            <EmptyState title="Sem movimentações" description="Suas transações aparecerão aqui." />
          </div>
        ) : null}
      </section>

      <section className="px-5 py-6">
        <Link to="/investimentos" className="surface-card flex items-center gap-3 p-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/15 text-accent">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Investimentos</p>
            <p className="text-xs text-muted-foreground">Faça seu dinheiro render a partir de R$ 1</p>
          </div>
        </Link>
      </section>
    </div>
  );
}

function QuickAction({
  to,
  icon: Icon,
  label,
}: {
  to: "/pix" | "/pagamentos";
  icon: typeof QrCode;
  label: string;
}) {
  return (
    <Link to={to} className="flex flex-col items-center gap-1.5 rounded-xl py-2">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
    </Link>
  );
}

function QuickActionButton({ icon: Icon, label }: { icon: typeof QrCode; label: string }) {
  return (
    <button className="flex flex-col items-center gap-1.5 rounded-xl py-2">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
    </button>
  );
}

function SummaryCard({
  label,
  value,
  tone,
  hidden,
}: {
  label: string;
  value: number;
  tone: "in" | "out";
  hidden: boolean;
}) {
  const Icon = tone === "in" ? TrendingUp : TrendingDown;
  return (
    <div className="surface-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className={tone === "in" ? "h-4 w-4 text-accent" : "h-4 w-4 text-destructive"} />
        {label}
      </div>
      <p className="mt-2 text-lg font-bold tabular-nums text-foreground">
        {hidden ? "••••" : brl(value)}
      </p>
    </div>
  );
}
