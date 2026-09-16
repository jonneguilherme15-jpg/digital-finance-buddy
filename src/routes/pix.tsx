import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, QrCode } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, EmptyState } from "@/components/finpay/AppShell";
import { TransactionRow } from "@/components/finpay/TransactionRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFinPay } from "@/lib/finpay-store";
import { brl, maskCurrencyInput, parseCurrencyInput } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pix")({
  head: () => ({
    meta: [
      { title: "Pix — FinPay" },
      { name: "description", content: "Envie e receba Pix por CPF, telefone, e-mail, chave aleatória ou QR Code." },
      { property: "og:title", content: "Pix — FinPay" },
      { property: "og:description", content: "Envie, receba e acompanhe seus Pix no FinPay." },
    ],
  }),
  component: PixPage,
});

const keyTypes = [
  { id: "cpf", label: "CPF", placeholder: "000.000.000-00" },
  { id: "telefone", label: "Telefone", placeholder: "(11) 90000-0000" },
  { id: "email", label: "E-mail", placeholder: "nome@email.com" },
  { id: "aleatoria", label: "Aleatória", placeholder: "chave-aleatoria-uuid" },
] as const;

function PixPage() {
  const { balance, transactions, sendPix, receivePix } = useFinPay();
  const [keyType, setKeyType] = useState<(typeof keyTypes)[number]["id"]>("cpf");
  const [pixKey, setPixKey] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);

  const value = parseCurrencyInput(amount);
  const pixHistory = transactions.filter((t) => t.kind === "pix");

  const openConfirm = () => {
    if (!pixKey.trim()) return setError("Informe a chave Pix do destinatário.");
    if (value <= 0) return setError("Informe um valor maior que zero.");
    if (value > balance) return setError("Saldo insuficiente para este Pix.");
    setError(null);
    setConfirming(true);
  };

  const confirm = () => {
    setSending(true);
    setTimeout(() => {
      sendPix({ key: pixKey, amount: value, description });
      setSending(false);
      setConfirming(false);
      setPixKey("");
      setAmount("");
      setDescription("");
      toast.success("Pix enviado com sucesso!", { description: `${brl(value)} para ${pixKey}` });
    }, 900);
  };

  return (
    <div>
      <PageHeader title="Pix" subtitle={`Saldo disponível: ${brl(balance)}`} />
      <div className="px-5 py-5">
        <Tabs defaultValue="enviar">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="enviar">Enviar</TabsTrigger>
            <TabsTrigger value="receber">Receber</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="enviar" className="mt-4 space-y-4">
            <div className="surface-card space-y-4 p-4">
              <div>
                <Label className="text-xs text-muted-foreground">Tipo de chave</Label>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {keyTypes.map((k) => (
                    <button
                      key={k.id}
                      onClick={() => setKeyType(k.id)}
                      className={cn(
                        "rounded-xl border px-2 py-2 text-[11px] font-medium transition-colors",
                        keyType === k.id
                          ? "border-accent bg-accent/10 text-foreground"
                          : "border-border text-muted-foreground",
                      )}
                    >
                      {k.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="chave">Chave do destinatário</Label>
                <Input
                  id="chave"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder={keyTypes.find((k) => k.id === keyType)!.placeholder}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="valor">Valor</Label>
                <div className="flex items-center gap-2 rounded-xl border border-input px-3">
                  <span className="text-sm text-muted-foreground">R$</span>
                  <Input
                    id="valor"
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => setAmount(maskCurrencyInput(e.target.value))}
                    placeholder="0,00"
                    className="border-0 px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="desc">Descrição (opcional)</Label>
                <Textarea
                  id="desc"
                  maxLength={140}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex.: almoço de sexta"
                />
              </div>

              {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}

              <Button className="w-full" onClick={openConfirm}>
                Continuar
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="receber" className="mt-4 space-y-4">
            <div className="surface-card flex flex-col items-center p-6 text-center">
              <div className="grid h-44 w-44 place-items-center rounded-2xl bg-secondary">
                <QrCode className="h-28 w-28 text-primary" strokeWidth={1.2} />
              </div>
              <p className="mt-4 text-sm font-semibold text-foreground">Seu QR Code Pix</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Mostre este código para receber um pagamento.
              </p>
              <div className="mt-4 w-full rounded-xl bg-secondary px-3 py-2 text-left">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Chave aleatória</p>
                <p className="truncate text-xs font-medium text-foreground">
                  b3f1c9a2-7d40-4c1e-9a58-finpay-demo
                </p>
              </div>
              <Button
                variant="secondary"
                className="mt-3 w-full"
                onClick={() => toast.success("Chave copiada!")}
              >
                <Copy className="mr-2 h-4 w-4" /> Copiar chave
              </Button>
              <Button
                className="mt-2 w-full"
                onClick={() => {
                  receivePix(150);
                  toast.success("Pix recebido!", { description: "R$ 150,00 via QR Code (demo)" });
                }}
              >
                Simular recebimento
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="historico" className="mt-4">
            {pixHistory.length ? (
              <div className="surface-card divide-y divide-border px-4">
                {pixHistory.map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Nenhum Pix ainda"
                description="Os Pix enviados e recebidos aparecem aqui."
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Confirmar Pix</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 rounded-xl bg-secondary p-4 text-sm">
            <Row label="Valor" value={brl(value)} strong />
            <Row label="Chave" value={pixKey} />
            <Row label="Tipo" value={keyTypes.find((k) => k.id === keyType)!.label} />
            {description ? <Row label="Descrição" value={description} /> : null}
            <Row label="Saldo após" value={brl(balance - value)} />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="secondary" onClick={() => setConfirming(false)} className="w-full">
              Voltar
            </Button>
            <Button onClick={confirm} disabled={sending} className="w-full">
              {sending ? "Enviando..." : "Confirmar Pix"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("min-w-0 break-words text-right", strong && "text-base font-bold")}>
        {value}
      </span>
    </div>
  );
}
