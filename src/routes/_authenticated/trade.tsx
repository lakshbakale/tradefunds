import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TradingViewChart } from "@/components/tradingview-chart";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/trade")({
  component: TradePage,
});

const SYMBOLS = [
  { value: "BINANCE:BTCUSDT", label: "BTC / USDT", basePrice: 95000 },
  { value: "BINANCE:ETHUSDT", label: "ETH / USDT", basePrice: 3500 },
  { value: "BINANCE:SOLUSDT", label: "SOL / USDT", basePrice: 200 },
  { value: "OANDA:EURUSD", label: "EUR / USD", basePrice: 1.08 },
  { value: "OANDA:XAUUSD", label: "Gold / USD", basePrice: 2650 },
  { value: "NASDAQ:AAPL", label: "Apple", basePrice: 230 },
  { value: "NASDAQ:TSLA", label: "Tesla", basePrice: 350 },
];

function TradePage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [symbol, setSymbol] = useState(SYMBOLS[0].value);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [size, setSize] = useState("0.1");
  const [accountId, setAccountId] = useState<string>("");

  const { data: accounts } = useQuery({
    queryKey: ["trade-accounts", user.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_challenges")
        .select("*, challenges(*)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      const list = data ?? [];
      if (list.length && !accountId) setAccountId(list[0].id);
      return list;
    },
  });

  const { data: openTrades } = useQuery({
    queryKey: ["open-trades", user.id, accountId],
    enabled: !!accountId,
    queryFn: async () => {
      const { data } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id)
        .eq("user_challenge_id", accountId)
        .order("opened_at", { ascending: false });
      return data ?? [];
    },
  });

  const symbolMeta = useMemo(() => SYMBOLS.find((s) => s.value === symbol)!, [symbol]);
  // Pseudo-live price: small jitter around base
  const livePrice = useMemo(() => {
    const jitter = (Math.random() - 0.5) * 0.01 * symbolMeta.basePrice;
    return symbolMeta.basePrice + jitter;
  }, [symbolMeta, openTrades]);

  const placeMutation = useMutation({
    mutationFn: async () => {
      if (!accountId) throw new Error("Select an account first");
      const sizeNum = Number(size);
      if (!sizeNum || sizeNum <= 0) throw new Error("Enter a valid size");
      const { error } = await supabase.from("trades").insert({
        user_id: user.id,
        user_challenge_id: accountId,
        symbol: symbolMeta.label,
        side,
        size: sizeNum,
        entry_price: livePrice,
        status: "open",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${side.toUpperCase()} ${size} ${symbolMeta.label} @ $${livePrice.toFixed(2)}`);
      qc.invalidateQueries({ queryKey: ["open-trades"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const closeMutation = useMutation({
    mutationFn: async (tradeId: string) => {
      const trade = openTrades?.find((t) => t.id === tradeId);
      if (!trade) throw new Error("Trade not found");
      // Simulate exit price near base + small drift
      const drift = (Math.random() - 0.4) * 0.015 * symbolMeta.basePrice;
      const exit = symbolMeta.basePrice + drift;
      const direction = trade.side === "buy" ? 1 : -1;
      const pnl = (exit - Number(trade.entry_price)) * Number(trade.size) * direction;

      const { error: tErr } = await supabase
        .from("trades")
        .update({ exit_price: exit, pnl, status: "closed", closed_at: new Date().toISOString() })
        .eq("id", tradeId);
      if (tErr) throw tErr;

      const acct = accounts?.find((a) => a.id === accountId);
      if (acct) {
        const newBal = Number(acct.current_balance) + pnl;
        const startBal = Number(acct.starting_balance);
        const targetPct = Number(acct.challenges?.profit_target_pct ?? 8);
        const maxLossPct = Number(acct.challenges?.max_total_loss_pct ?? 10);
        let status: string = acct.status;
        if (newBal >= startBal * (1 + targetPct / 100)) status = "passed";
        else if (newBal <= startBal * (1 - maxLossPct / 100)) status = "failed";

        await supabase.from("user_challenges").update({ current_balance: newBal, status }).eq("id", accountId);
      }
    },
    onSuccess: () => {
      toast.success("Trade closed");
      qc.invalidateQueries();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (!accounts) return <div className="p-10 text-muted-foreground">Loading…</div>;
  if (accounts.length === 0) {
    return (
      <div className="container mx-auto max-w-md px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold">No active account</h1>
        <p className="mt-2 text-muted-foreground">Start a challenge to get demo funds and begin trading.</p>
        <Button asChild className="mt-6 bg-gradient-primary"><Link to="/my-challenges">Pick a challenge</Link></Button>
      </div>
    );
  }

  const currentAcct = accounts.find((a) => a.id === accountId) ?? accounts[0];

  return (
    <div className="container mx-auto px-4 py-6 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Trade</h1>
          <p className="text-sm text-muted-foreground">Demo trading — no real funds at risk.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger className="w-[240px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.challenges?.name} — ${Number(a.current_balance).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={symbol} onValueChange={setSymbol}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SYMBOLS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground">Live ~ <span className="font-medium text-foreground">${livePrice.toFixed(2)}</span></div>
          </div>
          <TradingViewChart symbol={symbol} />
        </div>

        <div className="space-y-4">
          <Card className="border-border/60 bg-card p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Account balance</p>
            <p className="mt-1 text-2xl font-semibold">${Number(currentAcct.current_balance).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            <p className="text-xs text-muted-foreground">Start: ${Number(currentAcct.starting_balance).toLocaleString()}</p>
          </Card>

          <Card className="border-border/60 bg-card p-5">
            <p className="font-semibold">Place order</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button onClick={() => setSide("buy")} variant={side === "buy" ? "default" : "outline"} className={side === "buy" ? "bg-success text-success-foreground hover:bg-success/90" : ""}>Buy</Button>
              <Button onClick={() => setSide("sell")} variant={side === "sell" ? "default" : "outline"} className={side === "sell" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}>Sell</Button>
            </div>
            <div className="mt-4 space-y-2">
              <Label htmlFor="size">Size</Label>
              <Input id="size" type="number" step="0.01" value={size} onChange={(e) => setSize(e.target.value)} />
            </div>
            <div className="mt-3 text-sm text-muted-foreground">Entry ≈ ${livePrice.toFixed(2)}</div>
            <Button
              onClick={() => placeMutation.mutate()}
              disabled={placeMutation.isPending || currentAcct.status !== "active"}
              className="mt-4 w-full bg-gradient-primary shadow-glow"
            >
              {currentAcct.status !== "active" ? `Account ${currentAcct.status}` : `${side === "buy" ? "Buy" : "Sell"} ${symbolMeta.label.split(" ")[0]}`}
            </Button>
          </Card>

          <Card className="border-border/60 bg-card p-5">
            <p className="font-semibold">Open positions</p>
            <div className="mt-3 space-y-2">
              {openTrades?.filter((t) => t.status === "open").length === 0 && (
                <p className="text-sm text-muted-foreground">No open positions.</p>
              )}
              {openTrades?.filter((t) => t.status === "open").map((t) => (
                <div key={t.id} className="rounded-md border border-border/60 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{t.symbol}</span>
                    <Badge variant={t.side === "buy" ? "default" : "destructive"} className="uppercase">{t.side}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Size {Number(t.size)} @ ${Number(t.entry_price).toFixed(2)}
                  </div>
                  <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => closeMutation.mutate(t.id)} disabled={closeMutation.isPending}>
                    Close position
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
