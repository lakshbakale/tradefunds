import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Wallet, Activity, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();

  const { data } = useQuery({
    queryKey: ["dashboard", user.id],
    queryFn: async () => {
      const [uc, trades] = await Promise.all([
        supabase.from("user_challenges").select("*, challenges(*)").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("trades").select("*").eq("user_id", user.id).order("opened_at", { ascending: false }).limit(10),
      ]);
      return { challenges: uc.data ?? [], trades: trades.data ?? [] };
    },
  });

  const challenges = data?.challenges ?? [];
  const trades = data?.trades ?? [];
  const totalBalance = challenges.reduce((s, c) => s + Number(c.current_balance), 0);
  const totalPnl = challenges.reduce((s, c) => s + (Number(c.current_balance) - Number(c.starting_balance)), 0);
  const activeCount = challenges.filter((c) => c.status === "active").length;

  return (
    <div className="container mx-auto px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-muted-foreground">Here's how your accounts are performing.</p>
        </div>
        <Button asChild className="bg-gradient-primary shadow-glow"><Link to="/my-challenges">Start new challenge</Link></Button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <Stat icon={Wallet} label="Total balance" value={`$${totalBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
        <Stat icon={totalPnl >= 0 ? TrendingUp : TrendingDown} label="Total P&L" value={`${totalPnl >= 0 ? "+" : ""}$${totalPnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} positive={totalPnl >= 0} />
        <Stat icon={Trophy} label="Active accounts" value={String(activeCount)} />
        <Stat icon={Activity} label="Total trades" value={String(trades.length)} />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <Card className="border-border/60 bg-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your accounts</h2>
            <Button variant="ghost" size="sm" asChild><Link to="/my-challenges">View all</Link></Button>
          </div>
          {challenges.length === 0 ? (
            <div className="mt-8 rounded-lg border border-dashed border-border p-10 text-center">
              <p className="text-muted-foreground">No accounts yet.</p>
              <Button asChild className="mt-4 bg-gradient-primary"><Link to="/my-challenges">Buy your first challenge</Link></Button>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {challenges.slice(0, 4).map((c) => {
                const pnl = Number(c.current_balance) - Number(c.starting_balance);
                const pnlPct = (pnl / Number(c.starting_balance)) * 100;
                return (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border border-border bg-background/40 p-4">
                    <div>
                      <p className="font-medium">{c.challenges?.name ?? "Challenge"}</p>
                      <p className="text-xs text-muted-foreground">Started {new Date(c.started_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${Number(c.current_balance).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                      <p className={`text-xs ${pnl >= 0 ? "text-success" : "text-destructive"}`}>
                        {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} ({pnlPct.toFixed(2)}%)
                      </p>
                    </div>
                    <Badge variant={c.status === "active" ? "default" : c.status === "passed" ? "secondary" : "destructive"}>
                      {c.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="border-border/60 bg-card p-6">
          <h2 className="text-lg font-semibold">Recent trades</h2>
          {trades.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">No trades yet. Head to <Link to="/trade" className="text-primary underline">Trade</Link> to place your first.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {trades.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-sm">
                  <div>
                    <span className="font-medium">{t.symbol}</span>
                    <span className={`ml-2 text-xs uppercase ${t.side === "buy" ? "text-success" : "text-destructive"}`}>{t.side}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{t.status}</p>
                    {t.pnl != null && (
                      <p className={`text-xs ${Number(t.pnl) >= 0 ? "text-success" : "text-destructive"}`}>
                        {Number(t.pnl) >= 0 ? "+" : ""}${Number(t.pnl).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, positive }: { icon: typeof Wallet; label: string; value: string; positive?: boolean }) {
  return (
    <Card className="border-border/60 bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className={`h-4 w-4 ${positive === undefined ? "text-muted-foreground" : positive ? "text-success" : "text-destructive"}`} />
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </Card>
  );
}
