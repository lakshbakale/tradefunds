export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="container mx-auto px-6 py-10 text-sm text-muted-foreground">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} TradeFunds. Demo platform — trades are simulated.</p>
          <p>Trade responsibly. Past performance is not indicative of future results.</p>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground/70">
          TradeFunds is a simulated trading platform for educational purposes only.
        </p>
      </div>
    </footer>
  );
}
