import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useGetMarketAssets,
  useGetWatchlist,
  useAddToWatchlist,
  useRemoveFromWatchlist,
} from "@workspace/api-client-react";
import { Search, Star, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const CATEGORIES = ["All", "crypto", "forex", "stocks", "commodities"] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_LABELS: Record<string, string> = {
  All: "Tous",
  crypto: "Crypto",
  forex: "Forex",
  stocks: "Actions",
  commodities: "Matières 1ères",
};

function formatPrice(price: number) {
  if (price >= 1000) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
}

function formatVolume(vol: number) {
  if (vol >= 1_000_000_000) return `$${(vol / 1_000_000_000).toFixed(2)}B`;
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(2)}M`;
  return `$${vol.toLocaleString()}`;
}

export default function MarketPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: assets, isLoading, dataUpdatedAt } = useGetMarketAssets({
    query: { refetchInterval: 6000 } as any,
  });
  const { data: watchlist } = useGetWatchlist({ query: { refetchInterval: 10000 } as any });
  const addToWatchlist = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();

  const watchlistSymbols = new Set(watchlist?.map((w) => w.symbol) ?? []);

  const filtered = (assets ?? []).filter((a) => {
    const matchesSearch =
      a.symbol.toLowerCase().includes(search.toLowerCase()) ||
      a.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === "All" || a.category === category;
    return matchesSearch && matchesCat;
  });

  const toggleWatchlist = (symbol: string) => {
    if (watchlistSymbols.has(symbol)) {
      removeFromWatchlist.mutate(
        { symbol },
        { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/market/watchlist"] }) }
      );
    } else {
      addToWatchlist.mutate(
        { data: { symbol } },
        { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/market/watchlist"] }) }
      );
    }
  };

  const lastUpdate = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString("fr-FR") : null;

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Marchés</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {assets?.length ?? 0} actifs tradables
            </p>
          </div>
          {lastUpdate && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3 animate-spin-slow" />
              <span>Mis à jour à {lastUpdate}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un actif..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                variant={category === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setCategory(cat)}
              >
                {CATEGORY_LABELS[cat]}
              </Button>
            ))}
          </div>
        </div>

        <Card className="border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3 w-8"></th>
                  <th className="text-left px-4 py-3">Actif</th>
                  <th className="text-right px-4 py-3">Prix</th>
                  <th className="text-right px-4 py-3">24h</th>
                  <th className="text-right px-4 py-3 hidden sm:table-cell">Volume 24h</th>
                  <th className="text-right px-4 py-3 hidden md:table-cell">Catégorie</th>
                  <th className="text-right px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading &&
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td colSpan={7} className="px-4 py-3">
                        <div className="h-5 bg-secondary rounded animate-pulse" />
                      </td>
                    </tr>
                  ))}
                {!isLoading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      Aucun actif trouvé
                    </td>
                  </tr>
                )}
                {filtered.map((asset) => {
                  const positive = asset.change24hPercent >= 0;
                  const inWatchlist = watchlistSymbols.has(asset.symbol);
                  return (
                    <tr
                      key={asset.symbol}
                      className="border-b border-border/50 hover:bg-secondary/40 transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleWatchlist(asset.symbol)}
                          className="text-muted-foreground hover:text-yellow-400 transition-colors"
                          title={inWatchlist ? "Retirer de la liste" : "Ajouter à la watchlist"}
                        >
                          <Star
                            className={`h-4 w-4 ${inWatchlist ? "fill-yellow-400 text-yellow-400" : ""}`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                            {asset.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-mono font-semibold">{asset.symbol}</p>
                            <p className="text-xs text-muted-foreground">{asset.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium">
                        ${formatPrice(asset.currentPrice)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div
                          className={`flex items-center justify-end gap-1 font-medium text-sm ${
                            positive ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {positive ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {positive ? "+" : ""}
                          {asset.change24hPercent.toFixed(2)}%
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">
                        {formatVolume(asset.volume24h)}
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">
                        <Badge variant="outline" className="capitalize text-xs">
                          {CATEGORY_LABELS[asset.category] ?? asset.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          onClick={() => setLocation(`/dashboard?symbol=${encodeURIComponent(asset.symbol)}`)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-7 px-3 text-xs"
                        >
                          Trader
                        </Button>
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
