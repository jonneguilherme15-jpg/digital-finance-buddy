import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Protótipo/demo: todos os dados são fictícios e vivem em memória.
 * A forma dos objetos imita respostas de API bancária para facilitar
 * uma integração real futura (basta trocar as funções do provider).
 */

export type Category =
  | "alimentacao"
  | "transporte"
  | "lazer"
  | "compras"
  | "contas"
  | "outros"
  | "renda";

export const categoryLabels: Record<Category, string> = {
  alimentacao: "Alimentação",
  transporte: "Transporte",
  lazer: "Lazer",
  compras: "Compras",
  contas: "Contas",
  outros: "Outros",
  renda: "Renda",
};

export const categoryColors: Record<Category, string> = {
  alimentacao: "var(--chart-1)",
  transporte: "var(--chart-2)",
  lazer: "var(--chart-3)",
  compras: "var(--chart-4)",
  contas: "var(--chart-5)",
  outros: "var(--muted-foreground)",
  renda: "var(--accent)",
};

export type TxKind = "pix" | "cartao" | "boleto" | "deposito" | "saque" | "transferencia" | "investimento";

export type Transaction = {
  id: string;
  kind: TxKind;
  title: string;
  description?: string;
  amount: number; // positivo = entrada, negativo = saída
  category: Category;
  date: string; // ISO
};

export type Card = {
  id: string;
  label: string;
  number: string;
  holder: string;
  expiry: string;
  cvv: string;
  limit: number;
  used: number;
  blocked: boolean;
  virtual: boolean;
};

export type Goal = { id: string; name: string; target: number; saved: number };

export type Investment = {
  id: string;
  name: string;
  type: "CDB" | "Fundo" | "Renda Fixa";
  invested: number;
  yield: number;
  rate: string;
  risk: "Baixo" | "Médio";
  description: string;
};

export type Notification = {
  id: string;
  title: string;
  body: string;
  date: string;
  read: boolean;
  tone: "pix" | "cartao" | "pagamento" | "alerta";
};

const daysAgo = (d: number, h = 10) => {
  const date = new Date();
  date.setDate(date.getDate() - d);
  date.setHours(h, 24, 0, 0);
  return date.toISOString();
};

const initialTransactions: Transaction[] = [
  { id: "t1", kind: "pix", title: "Pix recebido · Marina Alves", amount: 450, category: "renda", date: daysAgo(0, 9) },
  { id: "t2", kind: "cartao", title: "Mercado Bom Preço", amount: -238.9, category: "alimentacao", date: daysAgo(0, 8) },
  { id: "t3", kind: "cartao", title: "Uber", amount: -27.4, category: "transporte", date: daysAgo(1, 19) },
  { id: "t4", kind: "boleto", title: "Conta de energia", amount: -189.32, category: "contas", date: daysAgo(2, 11) },
  { id: "t5", kind: "pix", title: "Pix enviado · João Pedro", amount: -120, category: "outros", date: daysAgo(3, 15) },
  { id: "t6", kind: "cartao", title: "Cinema Lumière", amount: -64, category: "lazer", date: daysAgo(4, 21) },
  { id: "t7", kind: "deposito", title: "Salário", amount: 6400, category: "renda", date: daysAgo(6, 7) },
  { id: "t8", kind: "cartao", title: "Loja Vesti", amount: -319.9, category: "compras", date: daysAgo(8, 16) },
  { id: "t9", kind: "cartao", title: "Posto Ipiranga", amount: -210, category: "transporte", date: daysAgo(11, 18) },
  { id: "t10", kind: "boleto", title: "Internet fibra", amount: -119.9, category: "contas", date: daysAgo(14, 10) },
  { id: "t11", kind: "pix", title: "Pix recebido · Freela design", amount: 1200, category: "renda", date: daysAgo(17, 13) },
  { id: "t12", kind: "cartao", title: "Restaurante Sabor", amount: -96.5, category: "alimentacao", date: daysAgo(21, 20) },
  { id: "t13", kind: "saque", title: "Saque caixa 24h", amount: -200, category: "outros", date: daysAgo(26, 12) },
  { id: "t14", kind: "cartao", title: "Streaming", amount: -39.9, category: "lazer", date: daysAgo(34, 9) },
  { id: "t15", kind: "deposito", title: "Salário", amount: 6400, category: "renda", date: daysAgo(36, 7) },
];

type Ctx = {
  balance: number;
  hideBalance: boolean;
  toggleHideBalance: () => void;
  transactions: Transaction[];
  cards: Card[];
  goals: Goal[];
  investments: Investment[];
  notifications: Notification[];
  unreadCount: number;
  sendPix: (input: { key: string; amount: number; description?: string }) => void;
  receivePix: (amount: number) => void;
  moveMoney: (input: { kind: "deposito" | "saque" | "transferencia"; amount: number; title: string }) => void;
  payBoleto: (input: { code: string; amount: number; title: string }) => void;
  toggleCardBlock: (id: string) => void;
  createVirtualCard: () => void;
  addGoal: (name: string, target: number) => void;
  depositGoal: (id: string, amount: number) => void;
  invest: (id: string, amount: number) => void;
  markAllRead: () => void;
};

const FinPayContext = createContext<Ctx | null>(null);

const uid = () => Math.random().toString(36).slice(2, 10);

export function FinPayProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState(12480.75);
  const [hideBalance, setHideBalance] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [cards, setCards] = useState<Card[]>([
    {
      id: "c1",
      label: "FinPay Black",
      number: "5432 8812 4471 9034",
      holder: "JONE G SILVA",
      expiry: "09/31",
      cvv: "418",
      limit: 8000,
      used: 5310.6,
      blocked: false,
      virtual: false,
    },
  ]);
  const [goals, setGoals] = useState<Goal[]>([
    { id: "g1", name: "Viagem para o Chile", target: 8000, saved: 3250 },
    { id: "g2", name: "Reserva de emergência", target: 15000, saved: 9400 },
  ]);
  const [investments, setInvestments] = useState<Investment[]>([
    {
      id: "i1",
      name: "CDB FinPay 110% CDI",
      type: "CDB",
      invested: 5000,
      yield: 312.44,
      rate: "110% do CDI",
      risk: "Baixo",
      description: "Rende todo dia e você pode resgatar quando quiser.",
    },
    {
      id: "i2",
      name: "Tesouro Selic 2029",
      type: "Renda Fixa",
      invested: 2500,
      yield: 138.9,
      rate: "Selic + 0,05%",
      risk: "Baixo",
      description: "O investimento mais conservador do Brasil, ideal para começar.",
    },
    {
      id: "i3",
      name: "Fundo Multimercado Horizonte",
      type: "Fundo",
      invested: 1800,
      yield: -42.3,
      rate: "Variável",
      risk: "Médio",
      description: "Pode oscilar no curto prazo, indicado para prazos maiores.",
    },
  ]);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "n1",
      title: "Pix recebido",
      body: "Você recebeu R$ 450,00 de Marina Alves.",
      date: daysAgo(0, 9),
      read: false,
      tone: "pix",
    },
    {
      id: "n2",
      title: "Compra no cartão",
      body: "Mercado Bom Preço · R$ 238,90 no FinPay Black.",
      date: daysAgo(0, 8),
      read: false,
      tone: "cartao",
    },
    {
      id: "n3",
      title: "Pagamento realizado",
      body: "Conta de energia paga: R$ 189,32.",
      date: daysAgo(2, 11),
      read: true,
      tone: "pagamento",
    },
  ]);

  const pushTx = useCallback((tx: Omit<Transaction, "id" | "date"> & { date?: string }) => {
    setTransactions((prev) => [{ id: uid(), date: new Date().toISOString(), ...tx }, ...prev]);
  }, []);

  const notify = useCallback((n: Omit<Notification, "id" | "date" | "read">) => {
    setNotifications((prev) => [{ id: uid(), date: new Date().toISOString(), read: false, ...n }, ...prev]);
  }, []);

  const sendPix: Ctx["sendPix"] = useCallback(
    ({ key, amount, description }) => {
      setBalance((b) => b - amount);
      pushTx({
        kind: "pix",
        title: `Pix enviado · ${key}`,
        description,
        amount: -amount,
        category: "outros",
      });
      notify({ title: "Pix enviado", body: `Pix de R$ ${amount.toFixed(2)} para ${key}.`, tone: "pix" });
    },
    [pushTx, notify],
  );

  const receivePix: Ctx["receivePix"] = useCallback(
    (amount) => {
      setBalance((b) => b + amount);
      pushTx({ kind: "pix", title: "Pix recebido · QR Code", amount, category: "renda" });
      notify({ title: "Pix recebido", body: `Você recebeu R$ ${amount.toFixed(2)} via QR Code.`, tone: "pix" });
    },
    [pushTx, notify],
  );

  const moveMoney: Ctx["moveMoney"] = useCallback(
    ({ kind, amount, title }) => {
      const signed = kind === "deposito" ? amount : -amount;
      setBalance((b) => b + signed);
      pushTx({ kind, title, amount: signed, category: kind === "deposito" ? "renda" : "outros" });
      notify({ title, body: `Valor de R$ ${amount.toFixed(2)} processado.`, tone: "pagamento" });
    },
    [pushTx, notify],
  );

  const payBoleto: Ctx["payBoleto"] = useCallback(
    ({ amount, title }) => {
      setBalance((b) => b - amount);
      pushTx({ kind: "boleto", title, amount: -amount, category: "contas" });
      notify({ title: "Pagamento realizado", body: `${title} · R$ ${amount.toFixed(2)}.`, tone: "pagamento" });
    },
    [pushTx, notify],
  );

  const toggleCardBlock: Ctx["toggleCardBlock"] = useCallback((id) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, blocked: !c.blocked } : c)));
  }, []);

  const createVirtualCard: Ctx["createVirtualCard"] = useCallback(() => {
    setCards((prev) => [
      ...prev,
      {
        id: uid(),
        label: `Virtual ${prev.filter((c) => c.virtual).length + 1}`,
        number: `5432 ${Math.floor(1000 + Math.random() * 8999)} ${Math.floor(1000 + Math.random() * 8999)} ${Math.floor(1000 + Math.random() * 8999)}`,
        holder: "JONE G SILVA",
        expiry: "12/32",
        cvv: String(Math.floor(100 + Math.random() * 899)),
        limit: 2000,
        used: 0,
        blocked: false,
        virtual: true,
      },
    ]);
  }, []);

  const addGoal: Ctx["addGoal"] = useCallback((name, target) => {
    setGoals((prev) => [...prev, { id: uid(), name, target, saved: 0 }]);
  }, []);

  const depositGoal: Ctx["depositGoal"] = useCallback((id, amount) => {
    setBalance((b) => b - amount);
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, saved: g.saved + amount } : g)));
  }, []);

  const invest: Ctx["invest"] = useCallback(
    (id, amount) => {
      setBalance((b) => b - amount);
      setInvestments((prev) => prev.map((i) => (i.id === id ? { ...i, invested: i.invested + amount } : i)));
      pushTx({ kind: "investimento", title: "Aplicação em investimento", amount: -amount, category: "outros" });
    },
    [pushTx],
  );

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      balance,
      hideBalance,
      toggleHideBalance: () => setHideBalance((v) => !v),
      transactions,
      cards,
      goals,
      investments,
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      sendPix,
      receivePix,
      moveMoney,
      payBoleto,
      toggleCardBlock,
      createVirtualCard,
      addGoal,
      depositGoal,
      invest,
      markAllRead,
    }),
    [
      balance,
      hideBalance,
      transactions,
      cards,
      goals,
      investments,
      notifications,
      sendPix,
      receivePix,
      moveMoney,
      payBoleto,
      toggleCardBlock,
      createVirtualCard,
      addGoal,
      depositGoal,
      invest,
      markAllRead,
    ],
  );

  return <FinPayContext.Provider value={value}>{children}</FinPayContext.Provider>;
}

export function useFinPay() {
  const ctx = useContext(FinPayContext);
  if (!ctx) throw new Error("useFinPay precisa estar dentro de FinPayProvider");
  return ctx;
}
