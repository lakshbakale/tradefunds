import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/my-challenges")({
  component: MyChallenges,
});

function MyChallenges() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();

  const { data: challenges } = useQuery({
    queryKey: ["all-challenges"],
    queryFn: async () => (await supabase.from("challenges").select("*").order("account_size")).data ?? [],
  });

  const { data: mine } = useQuery({
    queryKey: ["my-challenges", user.id],
    queryFn: async () => (await supabase.from("user_challenges").select("*, challenges(*)").eq("user_id", user.id).order("created_at", { ascending: false })).data ?? [],
  });

  const startMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      const ch = challenges?.find((c) => c.id === challengeId);
      if (!ch) throw new Error("Challenge not found");
      const { error } = await supabase.from("user_challenges").insert({
        user_id: user.id,
        challenge_id: challengeId,
        starting_balance: ch.account_size,
        current_balance: ch.account_size,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Challenge started! Demo funds credited.");
      qc.invalidateQueries({ queryKey: ["my-challenges"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="container mx-auto px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">My challenges</h1>
      <p className="mt-1 text-muted-foreground">Track progress on your active accounts and start new ones.</p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Active accounts</h2>
        {!mine || mine.length === 0 ? (
          <Card className="mt-3 border-dashed border-border bg-card/40 p-10 text-center text-muted-foreground">
            No active accounts. Start one below.
          </Card>
        ) : (
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {mine.map((m) => {
              const start = Number(m.starting_balance);
              const cur = Number(m.current_balance);
              const target = start * (1 + Number(m.challenges?.profit_target_pct ?? 8) / 100);
              const progress = Math.max(0, Math.min(100, ((cur - start) / (target - start)) * 100));
              const pnl = cur - start;
              return (
                <Card key={m.id} className="border-border/60 bg-card p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{m.challenges?.name}</p>
                      <p className="mt-1 text-2xl font-semibold">${cur.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                      <p className={`text-sm ${pnl >= 0 ? "text-success" : "text-destructive"}`}>{pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}</p>
                    </div>
                    <Badge variant={m.status === "active" ? "default" : m.status === "passed" ? "secondary" : "destructive"}>{m.status}</Badge>
                  </div>
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>Profit target progress</span>
                      <span>${target.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold">Start a new challenge</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {challenges?.map((c) => (
            <Card key={c.id} className="flex flex-col border-border/60 bg-card p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.name}</p>
              <p className="mt-1 text-2xl font-bold">${Number(c.account_size).toLocaleString()}</p>
              <ul className="mt-4 flex-1 space-y-1.5 text-sm">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" />{c.profit_target_pct}% target</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" />{c.max_daily_loss_pct}% daily DD</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" />{c.profit_split_pct}% split</li>
              </ul>
              <p className="mt-4 text-lg font-semibold">${c.price}</p>
              <Button
                disabled={startMutation.isPending}
                onClick={() => startMutation.mutate(c.id)}
                className="mt-3 bg-gradient-primary shadow-glow"
              >
                Start (demo)
              </Button>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
