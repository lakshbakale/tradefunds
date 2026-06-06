import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/challenges")({
  head: () => ({
    meta: [
      { title: "Challenges — TradeFunds" },
      { name: "description", content: "Pick a funded account from $10K to $200K and pass our one-step evaluation." },
    ],
  }),
  component: ChallengesPage,
});

function ChallengesPage() {
  const { data: challenges } = useQuery({
    queryKey: ["challenges"],
    queryFn: async () => (await supabase.from("challenges").select("*").order("account_size")).data ?? [],
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-gradient-hero">
        <div className="container mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Pick your <span className="text-gradient">challenge</span></h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">One-step evaluation. No time limits. Keep up to 80% of profits once funded.</p>
        </div>
      </section>

      <section className="container mx-auto px-6 py-16">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {challenges?.map((c, i) => {
            const featured = i === 2;
            return (
              <Card key={c.id} className={`relative flex flex-col border-border/60 bg-card p-6 transition-all hover:-translate-y-1 ${featured ? "border-primary shadow-glow" : "hover:shadow-card"}`}>
                {featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-primary px-3 py-1 text-xs font-medium">Most popular</span>
                )}
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.name}</p>
                <p className="mt-2 text-3xl font-bold">${Number(c.account_size).toLocaleString()}</p>
                <p className="mt-1 text-sm text-muted-foreground">Account size</p>

                <ul className="mt-6 flex-1 space-y-2 text-sm">
                  <Feature>{c.profit_target_pct}% profit target</Feature>
                  <Feature>{c.max_daily_loss_pct}% max daily loss</Feature>
                  <Feature>{c.max_total_loss_pct}% max total loss</Feature>
                  <Feature>{c.profit_split_pct}% profit split</Feature>
                  <Feature>No time limit</Feature>
                </ul>

                <div className="mt-6 border-t border-border/60 pt-4">
                  <p className="text-2xl font-semibold">${c.price}</p>
                  <p className="text-xs text-muted-foreground">one-time fee</p>
                  <Button asChild className="mt-4 w-full bg-gradient-primary shadow-glow">
                    <Link to="/dashboard">Start challenge</Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
      <span>{children}</span>
    </li>
  );
}
