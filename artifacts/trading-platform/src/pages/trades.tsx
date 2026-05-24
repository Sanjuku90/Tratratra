import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useGetMe,
  useGetTrades,
  useGetOpenPositions,
  useCancelTrade,
  useClosePosition,
} from "@workspace/api-client-react";
import { History, Activity, X, DollarSign } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPrice(n: number) {
  if (n >= 1000) return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(4);
  return n.toFixed(6);
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: "border-blue-500/50 text-blue-400",
    closed: "border-gray-500/50 text-gray-400",
    pending: "border-yellow-500/50 text-yellow-400",
    cancelled: "border-red-500/50 text-red-400",
  };
  const labels: Record<string, string> = {
    open: "Ouvert",
    closed: "Fermé",
    pending: "En attente",
    cancelled: "Annulé",
  };
  return (
    <Badge variant="outline" className={map[status] ?? ""}>
      {labels[status] ?? status}
    </Badge>
  );
}

export default function TradesPage() {
  const [tab, setTab] = useState<"open" | "history">("open");
  const { data: me } = useGetMe();
  const mode = (me?.tradingMode ?? "demo") as "real" | "demo";
  const queryClient = useQueryClient();
  const [closingId, setClosingId] = useState<number | null>(null);
  const [closeMsg, setCloseMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const { data: openPositions, isLoading: loadingOpen } = useGetOpenPositions(mode, {
    query: { refetchInterval: 5000 } as any,
  });
  const { data: trades, isLoading: loadingTrades } = useGetTrades(mode);
  const cancelTrade = useCancelTrade();
  const closePosition = useClosePosition();

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: [`/api/trades/${mode}/open`] });
    queryClient.invalidateQueries({ queryKey: [`/api/trades/${mode}`] });
    queryClient.invalidateQueries({ queryKey: [`/api/portfolio/${mode}`] });
    queryClient.invalidateQueries({ queryKey: [`/api/portfolio/${mode}/summary`] });
    queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
  };

  const handleClose = (id: number) => {
    setClosingId(id);
    closePosition.mutate(id, {
      onSuccess: (data: any) => {
        const pnl = data?.pnl ?? 0;
        setCloseMsg({
          text: `Position fermée. P&L: ${pnl >= 0 ? "+" : ""}$${fmt(Math.abs(pnl))}`,
          ok: pnl >= 0,
        });
        refresh();
        setClosingId(null);
        setTimeout(() => setCloseMsg(null), 4000);
      },
      onError: () => {
        setCloseMsg({ text: "Erreur lors de la fermeture.", ok: false });
        setClosingId(null);
        setTimeout(() => setCloseMsg(null), 3000);
      },
    });
  };

  const handleCancelPending = (id: number) => {
    cancelTrade.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [`/api/trades/${mode}`] });
        },
      }
    );
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Trades</h1>
          <p className="text-sm text-muted-foreground mt-0.5 capitalize">
            Mode {mode === "demo" ? "Démo" : "Réel"}
          </p>
        </div>

        {closeMsg && (
          <div className={`p-3 rounded-lg text-sm font-medium border ${
            closeMsg.ok
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}>
            {closeMsg.text}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant={tab === "open" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("open")}
            className="gap-2"
          >
            <Activity className="h-4 w-4" />
            Positions ouvertes
            {openPositions && openPositions.length > 0 && (
              <span className="ml-1 bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-full">
                {openPositions.length}
              </span>
            )}
          </Button>
          <Button
            variant={tab === "history" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("history")}
            className="gap-2"
          >
            <History className="h-4 w-4" />
            Historique
          </Button>
        </div>

        {tab === "open" && (
          <Card className="border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Actif</th>
                    <th className="text-right px-4 py-3">Direction</th>
                    <th className="text-right px-4 py-3">Quantité</th>
                    <th className="text-right px-4 py-3">Entrée</th>
                    <th className="text-right px-4 py-3">Actuel</th>
                    <th className="text-right px-4 py-3">P&L</th>
                    <th className="text-right px-4 py-3">Ouvert le</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingOpen &&
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td colSpan={8} className="px-4 py-3">
                          <div className="h-5 bg-secondary rounded animate-pulse" />
                        </td>
                      </tr>
                    ))}
                  {!loadingOpen && (!openPositions || openPositions.length === 0) && (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-muted-foreground">
                        Aucune position ouverte pour le moment
                      </td>
                    </tr>
                  )}
                  {openPositions?.map((pos) => {
                    const pnlPos = pos.pnl >= 0;
                    const isClosing = closingId === pos.id;
                    return (
                      <tr key={pos.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-mono font-semibold">{pos.symbol}</p>
                          <p className="text-xs text-muted-foreground">{pos.assetName}</p>
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
                        <td className="px-4 py-3 text-right font-mono">${fmtPrice(pos.entryPrice)}</td>
                        <td className="px-4 py-3 text-right font-mono">${fmtPrice(pos.currentPrice)}</td>
                        <td className="px-4 py-3 text-right">
                          <div>
                            <span className={`font-mono font-medium ${pnlPos ? "text-green-400" : "text-red-400"}`}>
                              {pnlPos ? "+" : ""}${fmt(Math.abs(pos.pnl))}
                            </span>
                            <p className={`text-xs ${pnlPos ? "text-green-400" : "text-red-400"}`}>
                              {pnlPos ? "+" : ""}{pos.pnlPercent.toFixed(2)}%
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                          {new Date(pos.openedAt).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleClose(pos.id)}
                            disabled={isClosing}
                            className="h-7 px-2 text-xs gap-1 border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                          >
                            <DollarSign className="h-3 w-3" />
                            {isClosing ? "..." : "Fermer"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {tab === "history" && (
          <Card className="border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Actif</th>
                    <th className="text-right px-4 py-3">Direction</th>
                    <th className="text-right px-4 py-3">Type</th>
                    <th className="text-right px-4 py-3">Quantité</th>
                    <th className="text-right px-4 py-3">Prix</th>
                    <th className="text-right px-4 py-3">P&L</th>
                    <th className="text-right px-4 py-3">Statut</th>
                    <th className="text-right px-4 py-3">Date</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {loadingTrades &&
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td colSpan={9} className="px-4 py-3">
                          <div className="h-5 bg-secondary rounded animate-pulse" />
                        </td>
                      </tr>
                    ))}
                  {!loadingTrades && (!trades || trades.length === 0) && (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-muted-foreground">
                        Aucun trade dans l'historique
                      </td>
                    </tr>
                  )}
                  {trades?.map((trade) => {
                    const pnlPos = (trade.pnl ?? 0) >= 0;
                    const orderTypeLabels: Record<string, string> = {
                      market: "Marché",
                      limit: "Limite",
                      stop_loss: "Stop Loss",
                      take_profit: "Take Profit",
                    };
                    return (
                      <tr key={trade.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-mono font-semibold">{trade.symbol}</p>
                          <p className="text-xs text-muted-foreground">{trade.assetName}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Badge
                            variant="outline"
                            className={trade.side === "buy" ? "border-green-500/50 text-green-400" : "border-red-500/50 text-red-400"}
                          >
                            {trade.side === "buy" ? "ACHAT" : "VENTE"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                          {orderTypeLabels[trade.orderType] ?? trade.orderType}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">{trade.quantity}</td>
                        <td className="px-4 py-3 text-right font-mono">${fmtPrice(trade.executedPrice ?? trade.price)}</td>
                        <td className="px-4 py-3 text-right">
                          {trade.pnl != null ? (
                            <span className={`font-mono font-medium ${pnlPos ? "text-green-400" : "text-red-400"}`}>
                              {pnlPos ? "+" : ""}${fmt(Math.abs(trade.pnl))}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">–</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <StatusBadge status={trade.status} />
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                          {new Date(trade.createdAt).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {trade.status === "pending" && (
                            <button
                              onClick={() => handleCancelPending(trade.id)}
                              disabled={cancelTrade.isPending}
                              title="Annuler l'ordre"
                              className="text-muted-foreground hover:text-red-400 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}
