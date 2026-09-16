import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Lock, LockOpen, Plus, Wifi } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, EmptyState } from "@/components/finpay/AppShell";
import { TransactionRow } from "@/components/finpay/TransactionRow";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useFinPay } from "@/lib/finpay-store";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/cartoes")({
  head: () => ({
    meta: [
      { title: "Cartões — FinPay" },
      { name: "description", content: "Gerencie cartões virtuais, limites, bloqueio e compras do FinPay." },
      { property: "og:title", content: "Cartões — FinPay" },
      { property: "og:description", content: "Cartão virtual, limite disponível e compras recentes." },
    ],
  }),
  component: CardsPage,
});

function CardsPage() {
  const { cards, toggleCardBlock, createVirtualCard, transactions } = useFinPay();
  const [showData, setShowData] = useState(false);
  const purchases = transactions.filter((t) => t.kind === "cartao");
  const totalLimit = cards.reduce((s, c) => s + c.limit, 0);
  const totalUsed = cards.reduce((s, c) => s + c.used, 0);
  const usagePct = Math.round((totalUsed / totalLimit) * 100);

  return (
    <div>
      <PageHeader
        title="Cartões"
        subtitle={`${cards.length} cartão(ões) ativos`}
        action={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              createVirtualCard();
              toast.success("Cartão virtual criado!");
            }}
          >
            <Plus className="mr-1 h-4 w-4" /> Virtual
          </Button>
        }
      />

      <div className="space-y-4 px-5 py-5">
        {usagePct >= 80 ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive">
            Atenção: você já usou {usagePct}% do limite total dos seus cartões.
          </div>
        ) : null}

        {cards.map((card) => (
          <div key={card.id} className="space-y-3">
            <div className="gradient-plastic relative overflow-hidden rounded-3xl p-5 text-primary-foreground shadow-[var(--shadow-card)]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-primary-foreground/70">
                    {card.virtual ? "Cartão virtual" : "Cartão físico"}
                  </p>
                  <p className="text-sm font-semibold">{card.label}</p>
                </div>
                <Wifi className="h-5 w-5 rotate-90 text-primary-foreground/80" />
              </div>
              <p className="mt-8 text-lg font-semibold tracking-[0.18em]">
                {showData ? card.number : "•••• •••• •••• " + card.number.slice(-4)}
              </p>
              <div className="mt-4 flex items-end justify-between text-xs">
                <div>
                  <p className="text-primary-foreground/60">Titular</p>
                  <p className="font-medium">{card.holder}</p>
                </div>
                <div>
                  <p className="text-primary-foreground/60">Validade</p>
                  <p className="font-medium">{card.expiry}</p>
                </div>
                <div>
                  <p className="text-primary-foreground/60">CVV</p>
                  <p className="font-medium">{showData ? card.cvv : "•••"}</p>
                </div>
              </div>
              {card.blocked ? (
                <div className="absolute inset-0 grid place-items-center bg-primary/70 backdrop-blur-[2px]">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Lock className="h-4 w-4" /> Cartão bloqueado
                  </span>
                </div>
              ) : null}
            </div>

            <div className="surface-card space-y-3 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Limite disponível</span>
                <span className="font-semibold tabular-nums">{brl(card.limit - card.used)}</span>
              </div>
              <Progress value={(card.used / card.limit) * 100} />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Utilizado {brl(card.used)}</span>
                <span>Total {brl(card.limit)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button variant="secondary" onClick={() => setShowData((v) => !v)}>
                  {showData ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                  {showData ? "Ocultar" : "Ver dados"}
                </Button>
                <Button
                  variant={card.blocked ? "default" : "outline"}
                  onClick={() => {
                    toggleCardBlock(card.id);
                    toast.success(card.blocked ? "Cartão desbloqueado" : "Cartão bloqueado");
                  }}
                >
                  {card.blocked ? (
                    <LockOpen className="mr-2 h-4 w-4" />
                  ) : (
                    <Lock className="mr-2 h-4 w-4" />
                  )}
                  {card.blocked ? "Desbloquear" : "Bloquear"}
                </Button>
              </div>
            </div>
          </div>
        ))}

        <section>
          <h2 className="text-sm font-semibold text-foreground">Compras no cartão</h2>
          <div className="mt-3">
            {purchases.length ? (
              <div className="surface-card divide-y divide-border px-4">
                {purchases.map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Nenhuma compra"
                description="As compras feitas no cartão aparecerão aqui."
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
