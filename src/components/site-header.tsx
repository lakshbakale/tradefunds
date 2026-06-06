import { Link } from "@tanstack/react-router";
import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-primary shadow-glow">
            <TrendingUp className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight">TradeFunds</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/challenges" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Challenges</Link>
          <a href="/#how" className="text-sm text-muted-foreground transition-colors hover:text-foreground">How it works</a>
          <a href="/#payouts" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Payouts</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button size="sm" asChild className="bg-gradient-primary shadow-glow hover:opacity-90">
            <Link to="/auth">Get funded</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
