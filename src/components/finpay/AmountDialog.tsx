import { useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { maskCurrencyInput, parseCurrencyInput } from "@/lib/format";

export function AmountDialog({
  trigger,
  title,
  description,
  confirmLabel = "Confirmar",
  max,
  onConfirm,
}: {
  trigger: ReactNode;
  title: string;
  description?: string;
  confirmLabel?: string;
  max?: number;
  onConfirm: (amount: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = () => {
    const amount = parseCurrencyInput(value);
    if (amount <= 0) return setError("Informe um valor maior que zero.");
    if (max !== undefined && amount > max) return setError("Saldo insuficiente para esta operação.");
    setError(null);
    setLoading(true);
    setTimeout(() => {
      onConfirm(amount);
      setLoading(false);
      setValue("");
      setOpen(false);
    }, 700);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setValue("");
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="valor">Valor</Label>
          <div className="flex items-center gap-2 rounded-xl border border-input px-3">
            <span className="text-sm text-muted-foreground">R$</span>
            <Input
              id="valor"
              inputMode="numeric"
              placeholder="0,00"
              value={value}
              onChange={(e) => setValue(maskCurrencyInput(e.target.value))}
              className="border-0 px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
            />
          </div>
          {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={loading} className="w-full">
            {loading ? "Processando..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
