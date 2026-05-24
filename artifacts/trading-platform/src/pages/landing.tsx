import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="px-6 py-4 border-b border-border flex items-center justify-between bg-card/50 backdrop-blur-sm fixed top-0 w-full z-10">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
          </svg>
          <span className="font-bold text-xl tracking-tight">NexusTrade</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in">
            <Button variant="ghost" className="font-medium text-muted-foreground hover:text-foreground">Sign In</Button>
          </Link>
          <Link href="/sign-up">
            <Button className="font-medium">Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-24 pb-16 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-4xl w-full text-center space-y-8 relative z-10">
          <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4">
            Professional Trading Environment
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Precision Trading for <br className="hidden md:block"/> Serious Retail Traders
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Bloomberg Terminal meets modern fintech. High-contrast, information-dense, and lightning-fast. Practice with $10,000 demo funds or trade real money in one unified cockpit.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link href="/sign-up">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 h-14">
                Open Demo Account
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 h-14 border-border bg-card hover:bg-secondary">
                Start Live Trading
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full mt-32 relative z-10">
          <div className="p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Lightning Fast</h3>
            <p className="text-muted-foreground">Built for speed. Real-time data feeds, instant order execution, and zero UI lag.</p>
          </div>
          <div className="p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Dual Modes</h3>
            <p className="text-muted-foreground">Seamlessly switch between paper trading and real capital without changing environments.</p>
          </div>
          <div className="p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Pro Analytics</h3>
            <p className="text-muted-foreground">Advanced charting, portfolio breakdown, and detailed trade history for deep analysis.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
