import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { useGetMe, useGetMarketAssets, useGetWatchlist } from "@workspace/api-client-react";

export default function DashboardPage() {
  const { data: userProfile } = useGetMe();
  const { data: assets } = useGetMarketAssets();
  const { data: watchlist } = useGetWatchlist();
  
  return (
    <Layout>
      <div className="p-4 sm:p-6 h-full flex flex-col">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1">
          {/* Watchlist Panel */}
          <Card className="col-span-1 border-border bg-card p-4 overflow-auto">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Watchlist</h2>
            <div className="space-y-2">
              {watchlist?.map(item => (
                <div key={item.symbol} className="flex justify-between items-center p-2 hover:bg-secondary rounded cursor-pointer">
                  <span className="font-mono font-medium">{item.symbol}</span>
                  <span className={item.change24h >= 0 ? "text-success" : "text-destructive"}>
                    {item.currentPrice.toFixed(2)}
                  </span>
                </div>
              ))}
              {(!watchlist || watchlist.length === 0) && (
                <div className="text-sm text-muted-foreground text-center py-4">No items in watchlist</div>
              )}
            </div>
          </Card>
          
          {/* Main Chart Area */}
          <Card className="col-span-1 lg:col-span-2 border-border bg-card p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Chart (BTC/USD)</h2>
            </div>
            <div className="flex-1 bg-secondary rounded border border-border flex items-center justify-center min-h-[300px]">
              <span className="text-muted-foreground">Chart Component Placeholder</span>
            </div>
          </Card>
          
          {/* Order Panel */}
          <Card className="col-span-1 border-border bg-card p-4">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Place Order</h2>
            <div className="space-y-4">
               {/* Order Form Placeholder */}
               <div className="bg-secondary/50 p-4 rounded text-sm text-muted-foreground text-center">
                 Order Form
               </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
