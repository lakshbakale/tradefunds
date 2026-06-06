import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ShieldCheck, Zap, TrendingUp, DollarSign, Trophy, BarChart3, Medal } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TradeFunds — Get funded up to $200K" },
      { name: "description", content: "Prove your trading skills, pass a challenge, and trade our capital. Keep up to 80% of the profits." },
      { property: "og:title", content: "TradeFunds — Get funded up to $200K" },
      { property: "og:description", content: "Pass the challenge, trade our capital, keep 80% of profits." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { data: challenges } = useQuery({
    queryKey: ["challenges-preview"],
    queryFn: async () => {
      const { data } = await supabase.from("challenges").select("*").order("account_size").limit(3);
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="container relative mx-auto px-6 pt-24 pb-32 text-center">
          <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-bold tracking-tight md:text-7xl">
            Master Trading with<br />
            <span className="text-gradient">TradeFunds</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Pass a one-step evaluation and access funded accounts up to $200,000. No time limits, instant scaling, up to 80% profit split.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild className="bg-gradient-primary shadow-glow hover:opacity-90">
              <Link to="/challenges">Start a challenge <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/auth">Open dashboard</Link>
            </Button>
          </div>

          <div className="mx-auto mt-10 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-2 text-xs text-muted-foreground backdrop-blur">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Simulated trading platform for educational purposes only
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="container mx-auto px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Three steps to funded</h2>
          <p className="mt-3 text-muted-foreground">A simple, transparent process. No hidden rules.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { icon: Trophy, title: "Pick a challenge", desc: "Choose an account size from $10K to $200K and pay the one-time fee." },
            { icon: BarChart3, title: "Hit the target", desc: "Reach 8% profit while respecting daily and total drawdown limits." },
            { icon: DollarSign, title: "Get funded & paid", desc: "Receive your funded account and keep up to 80% of all profits." },
          ].map((s, i) => (
            <Card key={s.title} className="border-border/60 bg-card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
                <s.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <p className="mt-4 text-xs text-muted-foreground">Step {i + 1}</p>
              <h3 className="mt-1 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Challenge Tiers */}
      <section className="container mx-auto px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Challenge Tiers</h2>
          <p className="mt-3 text-muted-foreground">Pick the account size that matches your skill level.</p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            { name: "Starter", size: 5000, price: 49, target: "8%", daily: "5%", split: "70%" },
            { name: "Pro", size: 10000, price: 99, target: "8%", daily: "5%", split: "75%" },
            { name: "Elite", size: 25000, price: 199, target: "10%", daily: "5%", split: "80%" },
          ].map((c) => (
            <Card key={c.name} className="group relative overflow-hidden border-border/60 bg-card p-6 transition-all hover:border-primary/60 hover:shadow-glow">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.name}</p>
              <p className="mt-1 text-4xl font-bold">${c.size.toLocaleString()}</p>
              <p className="mt-3 text-sm text-muted-foreground">Demo account for practice trading.</p>
              <div className="mt-5 space-y-2 text-sm">
                <Row label="Profit target" value={c.target} />
                <Row label="Max daily loss" value={c.daily} />
                <Row label="Profit split" value={c.split} />
              </div>
              <div className="mt-6 flex items-center justify-between">
                <p className="text-2xl font-semibold">${c.price}</p>
                <Button size="sm" asChild className="bg-gradient-primary"><Link to="/auth">Start</Link></Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Challenges preview */}
      <section className="container mx-auto px-6 py-16">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Choose your firepower</h2>
            <p className="mt-2 text-muted-foreground">Same rules, scaled to your ambition.</p>
          </div>
          <Button variant="ghost" asChild className="hidden md:inline-flex">
            <Link to="/challenges">See all <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {challenges?.map((c) => (
            <Card key={c.id} className="group relative overflow-hidden border-border/60 bg-card p-6 transition-all hover:border-primary/60 hover:shadow-glow">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.name.split(" ")[0]}</p>
              <p className="mt-1 text-4xl font-bold">${Number(c.account_size).toLocaleString()}</p>
              <p className="mt-3 text-sm text-muted-foreground">{c.description}</p>
              <div className="mt-5 space-y-2 text-sm">
                <Row label="Profit target" value={`${c.profit_target_pct}%`} />
                <Row label="Max daily loss" value={`${c.max_daily_loss_pct}%`} />
                <Row label="Profit split" value={`${c.profit_split_pct}%`} />
              </div>
              <div className="mt-6 flex items-center justify-between">
                <p className="text-2xl font-semibold">${c.price}</p>
                <Button size="sm" asChild className="bg-gradient-primary"><Link to="/auth">Start</Link></Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Why */}
      <section id="payouts" className="container mx-auto px-6 py-24">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Zap, title: "One-step evaluation", desc: "No two-phase nonsense. Pass once, get a demo funded account." },
            { icon: ShieldCheck, title: "Transparent rules", desc: "Clear daily and total drawdown. No surprise breaches." },
            { icon: TrendingUp, title: "Built to practice", desc: "Hone your edge in a realistic risk-managed environment." },
          ].map((f) => (
            <Card key={f.title} className="border-border/60 bg-card p-6">
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Leaderboard */}
      <section id="leaderboard" className="container mx-auto px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Demo Leaderboard</h2>
          <p className="mt-3 text-muted-foreground">Top simulated performers this month. Results are from demo accounts.</p>
        </div>
        <Card className="mt-8 border-border/60 bg-card p-2">
          <div className="divide-y divide-border/60">
            {[
              { rank: 1, name: "Alex K.", acct: "Elite $25K", gain: 18.4 },
              { rank: 2, name: "Priya S.", acct: "Pro $10K", gain: 15.1 },
              { rank: 3, name: "Marco D.", acct: "Elite $25K", gain: 12.7 },
              { rank: 4, name: "Lena V.", acct: "Pro $10K", gain: 10.2 },
              { rank: 5, name: "Jordan B.", acct: "Starter $5K", gain: 8.9 },
            ].map((r) => (
              <div key={r.rank} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${r.rank <= 3 ? "bg-gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                    {r.rank <= 3 ? <Medal className="h-4 w-4" /> : <span className="text-xs font-semibold">{r.rank}</span>}
                  </div>
                  <div>
                    <p className="font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.acct}</p>
                  </div>
                </div>
                <p className="text-success font-semibold">+{r.gain.toFixed(2)}%</p>
              </div>
            ))}
          </div>
        </Card>
        <p className="mt-3 text-center text-xs text-muted-foreground/70">Illustrative demo data — not real trader results.</p>
      </section>

      {/* FAQ */}
      <section id="faq" className="container mx-auto px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Frequently asked questions</h2>
          <p className="mt-3 text-muted-foreground">Everything you need to know about the simulated platform.</p>
        </div>
        <div className="mx-auto mt-8 max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {[
              { q: "Is this real money trading?", a: "No. TradeFunds is entirely simulated for educational purposes. All balances, trades, and payouts are virtual." },
              { q: "How does the challenge work?", a: "Pick an account size, hit the profit target without breaching the daily or total drawdown, and your demo account is marked as passed." },
              { q: "What markets can I trade?", a: "You can practice on major forex pairs, indices, commodities and crypto via the TradingView chart inside the dashboard." },
              { q: "Do I need to deposit money?", a: "No deposits are required. Everything runs on a virtual $10,000 starting balance so you can focus on learning." },
              { q: "Can I reset my account?", a: "Yes. You can start a new challenge any time from the My Challenges page." },
            ].map((f) => (
              <AccordionItem key={f.q} value={f.q}>
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 pb-24">
        <Card className="relative overflow-hidden border-border/60 bg-gradient-hero p-12 text-center shadow-card">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Ready to prove yourself?</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Sign up free, pick your account, and start trading in minutes.</p>
          <Button size="lg" asChild className="mt-6 bg-gradient-primary shadow-glow">
            <Link to="/auth">Create your account</Link>
          </Button>
        </Card>
      </section>

      <SiteFooter />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
