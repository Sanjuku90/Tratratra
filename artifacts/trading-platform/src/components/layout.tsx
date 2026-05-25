import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { useGetMe, useUpdateMe } from "@workspace/api-client-react";
import {
  LayoutDashboard,
  LineChart,
  PieChart,
  History,
  Wallet,
  Settings,
  LogOut,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/market", label: "Marchés", icon: LineChart },
  { href: "/portfolio", label: "Portfolio", icon: PieChart },
  { href: "/trades", label: "Trades", icon: History },
  { href: "/wallet", label: "Wallet", icon: Wallet },
];

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();
  const { data: userProfile } = useGetMe();
  const updateMe = useUpdateMe();

  const toggleMode = () => {
    if (!userProfile) return;
    updateMe.mutate({
      data: {
        tradingMode: userProfile.tradingMode === "real" ? "demo" : "real",
      },
    });
  };

  const NavLinks = () => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.href;
        return (
          <Link key={item.href} href={item.href}>
            <div
              className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-md transition-all cursor-pointer ${
                isActive
                  ? "md:bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:md:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 md:h-4 md:w-4 ${isActive ? "drop-shadow-[0_0_8px_rgba(109,40,217,0.8)]" : ""}`} />
              <span className="text-[10px] md:text-sm">{item.label}</span>
            </div>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex h-[100dvh] bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card/50 backdrop-blur-md relative z-20 shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
        <div className="p-5 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 cursor-pointer group">
            <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center border border-primary/30 group-hover:border-primary/60 transition-colors shadow-[0_0_15px_rgba(109,40,217,0.3)]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-primary">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tight">NexusTrade</span>
          </Link>
        </div>
        
        <div className="flex-1 py-4 px-3 space-y-1">
          <NavLinks />
        </div>

        <div className="p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start px-2 h-12 hover:bg-secondary/50 border border-transparent hover:border-border transition-colors">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0 border border-primary/20">
                      {userProfile?.displayName?.charAt(0).toUpperCase() || clerkUser?.emailAddresses[0].emailAddress.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left overflow-hidden">
                      <p className="text-sm font-medium truncate leading-tight">
                        {userProfile?.displayName || "Trader"}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate font-mono mt-0.5">
                        {clerkUser?.emailAddresses[0].emailAddress}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border-border bg-card/95 backdrop-blur-xl shadow-2xl">
              <div className="px-2 py-2.5 flex items-center justify-between">
                <span className="text-sm font-medium">Mode de trading</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={toggleMode}
                  className={`h-7 px-2.5 text-xs font-bold transition-all ${userProfile?.tradingMode === 'demo' ? 'text-primary border-primary/40 hover:bg-primary/10' : 'text-success border-success/40 hover:bg-success/10'}`}
                >
                  {userProfile?.tradingMode === 'demo' ? 'DEMO' : 'LIVE'}
                </Button>
              </div>
              <DropdownMenuSeparator className="bg-border" />
              <Link href="/settings">
                <DropdownMenuItem className="cursor-pointer focus:bg-secondary">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Paramètres</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL || "/" })} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Déconnexion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-[100dvh] relative">
        <main className="flex-1 overflow-auto bg-background pb-16 md:pb-0">
          <div className="h-full w-full flex flex-col">
            {/* Top bar for desktop & mobile mode indicator */}
            <div className="flex h-14 border-b border-border/60 bg-card/30 backdrop-blur-sm items-center justify-between px-4 md:px-6 sticky top-0 z-10">
               <div className="md:hidden flex items-center gap-2">
                 <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center border border-primary/30">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-primary">
                      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                      <polyline points="16 7 22 7 22 13" />
                    </svg>
                 </div>
                 <span className="font-bold tracking-tight">NexusTrade</span>
               </div>
               <div className="hidden md:block"></div>
               {userProfile && (
                 <div className="flex items-center gap-3">
                   <div className={`px-2.5 py-1 rounded text-[10px] tracking-wider font-bold border shadow-sm ${userProfile.tradingMode === 'demo' ? 'bg-primary/5 text-primary border-primary/30 shadow-primary/20' : 'bg-success/5 text-success border-success/30 shadow-success/20'}`}>
                     {userProfile.tradingMode === 'demo' ? 'DEMO ACCOUNT' : 'LIVE ACCOUNT'}
                   </div>
                 </div>
               )}
            </div>
            
            <div className="flex-1 flex flex-col min-h-0">
              {children}
            </div>
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-xl border-t border-border z-50 flex items-center justify-around px-2 shadow-[0_-4px_24px_rgba(0,0,0,0.2)]">
          <NavLinks />
          <Link href="/settings">
            <div
              className={`flex flex-col items-center gap-1 px-2 py-2 rounded-md transition-all cursor-pointer ${
                location === "/settings"
                  ? "text-primary font-medium"
                  : "text-muted-foreground"
              }`}
            >
              <Settings className={`h-5 w-5 ${location === "/settings" ? "drop-shadow-[0_0_8px_rgba(109,40,217,0.8)]" : ""}`} />
              <span className="text-[10px]">Paramètres</span>
            </div>
          </Link>
        </nav>
      </div>
    </div>
  );
}