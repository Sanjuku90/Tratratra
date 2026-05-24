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
  Menu,
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/market", label: "Market", icon: LineChart },
  { href: "/portfolio", label: "Portfolio", icon: PieChart },
  { href: "/trades", label: "Trades", icon: History },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/settings", label: "Settings", icon: Settings },
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
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </div>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
            <span className="font-bold text-lg tracking-tight">NexusTrade</span>
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <NavLinks />
        </div>

        <div className="p-4 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start px-2 hover:bg-secondary">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                      {userProfile?.displayName?.charAt(0).toUpperCase() || clerkUser?.emailAddresses[0].emailAddress.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left overflow-hidden">
                      <p className="text-sm font-medium truncate">
                        {userProfile?.displayName || "Trader"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {clerkUser?.emailAddresses[0].emailAddress}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 flex items-center justify-between">
                <span className="text-sm font-medium">Trading Mode</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={toggleMode}
                  className={`h-7 px-2 text-xs font-bold ${userProfile?.tradingMode === 'demo' ? 'text-primary border-primary/50' : 'text-success border-success/50'}`}
                >
                  {userProfile?.tradingMode === 'demo' ? 'DEMO' : 'LIVE'}
                </Button>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL || "/" })} className="text-destructive focus:text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile Header & Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
          <Link href="/dashboard" className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
            <span className="font-bold text-lg">NexusTrade</span>
          </Link>

          <div className="flex items-center gap-4">
            {userProfile && (
               <div className={`px-2 py-0.5 rounded text-xs font-bold border ${userProfile.tradingMode === 'demo' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-success/10 text-success border-success/20'}`}>
                 {userProfile.tradingMode === 'demo' ? 'DEMO' : 'LIVE'}
               </div>
            )}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="p-4 border-b border-border">
                  <span className="font-bold text-lg">NexusTrade</span>
                </div>
                <div className="py-4 px-3 space-y-1">
                  <NavLinks />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-background">
          <div className="h-full w-full">
            {/* Inject a top bar for desktop mode indicator if needed */}
            <div className="hidden md:flex h-14 border-b border-border bg-card items-center justify-end px-6">
              {userProfile && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Current Mode:</span>
                  <div className={`px-2.5 py-1 rounded text-xs font-bold border ${userProfile.tradingMode === 'demo' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-success/10 text-success border-success/20'}`}>
                    {userProfile.tradingMode === 'demo' ? 'DEMO ACCOUNT' : 'LIVE ACCOUNT'}
                  </div>
                </div>
              )}
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
