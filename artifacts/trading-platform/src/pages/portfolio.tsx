import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGetMe, useGetPortfolio, useGetPortfolioSummary } from "@workspace/api-client-react";
import { TrendingUp, TrendingDown, BarChart2, Target, Activity, Layers } from "lucide-react";

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function PnlBadge({ value }: { value: number }) {
  const pos = value >= 0;
  return (
    <span className={`font-medium text-sm ${pos ? "text-green-400" : "text-red-400"}`}>
      {pos ? "+" : ""}${fmt(Math.abs(value))}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  positive,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  positive?: boolean;
}) {
  return (
    <Card className="border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold mt-1 font-mono">{value}</p>
          {sub && (
            <p
              className={`text-xs mt-1 ${
                positive === undefined
                  ? "text-muted-foreground"
                  : positive
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {sub}
            </p>
          )}
        </div>
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </Card>
  );
}

export default function PortfolioPage() {
  const { data: me } = useGetMe();
  const mode = (me?.tradingMode ?? "demo") as "real" | "demo";

  const { data: portfolio, isLoading: loadingPortfolio } = useGetPortfolio(mode);
  const { data: summary, isLoading: loadingSummary } = useGetPortfolioSummary(mode);

  const isLoading = loadingPortfolio || loadingSummary;

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Portfolio</h1>
          <p className="text-sm text-muted-foreground mt-0.5 capitalize">
            Mode {mode === "demo" ? "Démo" : "Réel"}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-border bg-card p-4 h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Valeur totale"
              value={`$${fmt(portfolio?.totalValue ?? 0)}`}
              icon={BarChart2}
            />
            <StatCard
              label="P&L Total"
              value={`${portfolio?.totalPnl && portfolio.totalPnl >= 0 ? "+" : ""}$${fmt(Math.abs(portfolio?.totalPnl ?? 0))}`}
              sub={`${portfolio?.totalPnlPercent?.toFixed(2)}%`}
              icon={TrendingUp}
              positive={(portfolio?.totalPnl ?? 0) >= 0}
            />
            <StatCard
              label="Taux de réussite"
              value={`${(summary?.winRate ?? 0).toFixed(1)}%`}
              sub={`${summary?.totalTrades ?? 0} trades total`}
              icon={Target}
            />
            <StatCard
              label="Positions ouvertes"
              value={String(summary?.openPositions ?? 0)}
              sub={`${portfolio?.positions?.length ?? 0} actifs`}
              icon={Layers}
            />
          </div>
        )}

        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium">Meilleur trade</span>
              </div>
              <p className="text-xl font-bold font-mono text-green-400">
                {summary.bestTrade != null ? `+$${fmt(summary.bestTrade)}` : "–"}
              </p>
            </Card>
            <Card className="border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-4 w-4 text-red-400" />
                <span className="text-sm font-medium">Pire trade</span>
              </div>
              <p className="text-xl font-bold font-mono text-red-400">
                {summary.worstTrade != null ? `-$${fmt(Math.abs(summary.worstTrade))}` : "–"}
              </p>
            </Card>
          </div>
        )}

        <Card className="border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Positions ouvertes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Actif</th>
                  <th className="text-right px-4 py-3">Direction</th>
                  <th className="text-right px-4 py-3">Quantité</th>
                  <th className="text-right px-4 py-3">Prix d'entrée</th>
                  <th className="text-right px-4 py-3">Prix actuel</th>
                  <th className="text-right px-4 py-3">P&L</th>
                </tr>
              </thead>
              <tbody>
                {isLoading &&
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="h-5 bg-secondary rounded animate-pulse" />
                      </td>
                    </tr>
                  ))}
                {!isLoading && (!portfolio?.positions || portfolio.positions.length === 0) && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      Aucune position ouverte. Commencez à trader depuis le Dashboard.
                    </td>
                  </tr>
                )}
                {portfolio?.positions?.map((pos) => {
                  const pnlPos = pos.pnl >= 0;
                  return (
                    <tr key={pos.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-mono font-semibold">{pos.symbol}</p>
                          <p className="text-xs text-muted-foreground">{pos.assetName}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge
                          variant="outline"
                          className={pos.side === "buy" ? "border-green-500/50 text-green-400" : "border-red-500/50 text-red-400"}
                        >
                          {pos.side === "buy" ? "ACHAT" : "VENTE"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{pos.quantity}</td>
                      <td className="px-4 py-3 text-right font-mono">${fmt(pos.entryPrice)}</td>
                      <td className="px-4 py-3 text-right font-mono">${fmt(pos.currentPrice)}</td>
                      <td className="px-4 py-3 text-right">
                        <div>
                          <PnlBadge value={pos.pnl} />
                          <p className={`text-xs ${pnlPos ? "text-green-400" : "text-red-400"}`}>
                            {pnlPos ? "+" : ""}{pos.pnlPercent.toFixed(2)}%
                          </p>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
