import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CandlestickChart } from "@/components/candlestick-chart";
import {
  useGetMe,
  useGetMarketAssets,
  useGetWatchlist,
  useGetCandles,
  useGetAssetPrice,
  useAddToWatchlist,
  useRemoveFromWatchlist,
  useCreateTrade,
} from "@workspace/api-client-react";
import { Star, TrendingUp, TrendingDown, ChevronDown } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function fmt(n: number, digits = 2) {
  if (n >= 1000) return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  if (n >= 1) return n.toFixed(Math.max(digits, 4));
  return n.toFixed(6);
}

const ORDER_TYPES = [
  { value: "market", label: "Marché" },
  { value: "limit", label: "Limite" },
  { value: "stop_loss", label: "Stop Loss" },
  { value: "take_profit", label: "Take Profit" },
] as const;
type OrderType = (typeof ORDER_TYPES)[number]["value"];

export default function DashboardPage() {
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);
  const symbolFromUrl = params.get("symbol");

  const queryClient = useQueryClient();
  const { data: me } = useGetMe();
  const { data: assets } = useGetMarketAssets();
  const { data: watchlist } = useGetWatchlist();

  const [selectedSymbol, setSelectedSymbol] = useState(symbolFromUrl ?? "BTC");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [orderMessage, setOrderMessage] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (symbolFromUrl) setSelectedSymbol(symbolFromUrl);
  }, [symbolFromUrl]);

  const { data: candles } = useGetCandles(selectedSymbol);
  const { data: assetPrice } = useGetAssetPrice(selectedSymbol);

  const addToWatchlist = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();
  const createTrade = useCreateTrade();

  const watchlistSymbols = new Set(watchlist?.map((w) => w.symbol) ?? []);
  const inWatchlist = watchlistSymbols.has(selectedSymbol);

  const mode = (me?.tradingMode ?? "demo") as "real" | "demo";

  const selectedAsset = assets?.find((a) => a.symbol === selectedSymbol);

  useEffect(() => {
    if (assetPrice && orderType === "market") {
      setPrice(assetPrice.price.toString());
    }
  }, [assetPrice, orderType]);

  const toggleWatchlist = () => {
    if (inWatchlist) {
      removeFromWatchlist.mutate(
        { symbol: selectedSymbol },
        { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/market/watchlist"] }) }
      );
    } else {
      addToWatchlist.mutate(
        { data: { symbol: selectedSymbol } },
        { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/market/watchlist"] }) }
      );
    }
  };

  const handleOrder = () => {
    const qty = parseFloat(quantity);
    const px = parseFloat(price);
    if (!qty || !px || qty <= 0 || px <= 0) {
      setOrderMessage({ text: "Quantité et prix requis.", ok: false });
      setTimeout(() => setOrderMessage(null), 3000);
      return;
    }
    createTrade.mutate(
      {
        data: {
          symbol: selectedSymbol,
          side,
          orderType,
          quantity: qty,
          price: px,
          stopLoss: stopLoss ? parseFloat(stopLoss) : null,
          takeProfit: takeProfit ? parseFloat(takeProfit) : null,
          mode,
        },
      },
      {
        onSuccess: () => {
          setOrderMessage({ text: `Ordre ${side === "buy" ? "d'achat" : "de vente"} placé avec succès !`, ok: true });
          setQuantity("");
          setStopLoss("");
          setTakeProfit("");
          queryClient.invalidateQueries({ queryKey: [`/api/trades/${mode}`] });
          queryClient.invalidateQueries({ queryKey: [`/api/trades/${mode}/open`] });
          queryClient.invalidateQueries({ queryKey: [`/api/portfolio/${mode}`] });
          setTimeout(() => setOrderMessage(null), 3000);
        },
        onError: (err: any) => {
          setOrderMessage({ text: err?.message ?? "Erreur lors du placement.", ok: false });
          setTimeout(() => setOrderMessage(null), 4000);
        },
      }
    );
  };

  const positive = (assetPrice?.change24hPercent ?? 0) >= 0;

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-112px)] md:h-[calc(100vh-56px)] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_280px] gap-0 flex-1 overflow-hidden">
          
          {/* Watchlist */}
          <aside className="hidden lg:flex flex-col border-r border-border bg-card overflow-hidden">
            <div className="px-3 py-2.5 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Watchlist</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {(!watchlist || watchlist.length === 0) && (
                <p className="text-xs text-muted-foreground text-center py-6 px-3">
                  Ajoutez des actifs depuis la page Marché
                </p>
              )}
              {watchlist?.map((item) => {
                const pos = item.change24hPercent >= 0;
                const active = item.symbol === selectedSymbol;
                return (
                  <button
                    key={item.symbol}
                    onClick={() => setSelectedSymbol(item.symbol)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 hover:bg-secondary/60 transition-colors text-left ${
                      active ? "bg-secondary/80 border-l-2 border-primary" : ""
                    }`}
                  >
                    <div>
                      <p className="font-mono font-semibold text-xs">{item.symbol}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[90px]">{item.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-xs font-medium">${fmt(item.currentPrice)}</p>
                      <p className={`text-xs ${pos ? "text-green-400" : "text-red-400"}`}>
                        {pos ? "+" : ""}{item.change24hPercent.toFixed(2)}%
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Asset selector */}
            <div className="p-3 border-t border-border">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-between gap-1 text-xs">
                    Changer d'actif
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 max-h-60 overflow-y-auto">
                  {assets?.map((a) => (
                    <DropdownMenuItem
                      key={a.symbol}
                      onClick={() => setSelectedSymbol(a.symbol)}
                      className="font-mono text-xs"
                    >
                      {a.symbol} — {a.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </aside>

          {/* Chart area */}
          <div className="flex flex-col overflow-hidden border-r border-border min-h-0">
            {/* Asset header */}
            <div className="px-4 py-2.5 border-b border-border bg-card flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="lg:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1 text-xs font-mono">
                        {selectedSymbol} <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48 max-h-60 overflow-y-auto">
                      {assets?.map((a) => (
                        <DropdownMenuItem key={a.symbol} onClick={() => setSelectedSymbol(a.symbol)} className="font-mono text-xs">
                          {a.symbol}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="hidden lg:block">
                  <span className="font-mono font-bold text-lg">{selectedSymbol}</span>
                  <span className="text-muted-foreground text-sm ml-2">{selectedAsset?.name}</span>
                </div>
                {assetPrice && (
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg">${fmt(assetPrice.price)}</span>
                    <span className={`flex items-center gap-0.5 text-sm font-medium ${positive ? "text-green-400" : "text-red-400"}`}>
                      {positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      {positive ? "+" : ""}{assetPrice.change24hPercent.toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                {assetPrice && (
                  <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
                    <span>H: <span className="text-foreground font-mono">${fmt(assetPrice.high24h)}</span></span>
                    <span>L: <span className="text-foreground font-mono">${fmt(assetPrice.low24h)}</span></span>
                  </div>
                )}
                <button
                  onClick={toggleWatchlist}
                  className="text-muted-foreground hover:text-yellow-400 transition-colors"
                  title={inWatchlist ? "Retirer" : "Ajouter à la watchlist"}
                >
                  <Star className={`h-4 w-4 ${inWatchlist ? "fill-yellow-400 text-yellow-400" : ""}`} />
                </button>
              </div>
            </div>

            {/* Chart */}
            <div className="flex-1 p-2 bg-background min-h-0">
              {candles && candles.length > 0 ? (
                <CandlestickChart candles={candles} symbol={selectedSymbol} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                  Chargement du graphique...
                </div>
              )}
            </div>

            {/* Price details bar */}
            {assetPrice && (
              <div className="shrink-0 px-4 py-2 bg-card border-t border-border flex gap-6 text-xs text-muted-foreground overflow-x-auto">
                <span>Bid: <span className="text-red-400 font-mono">${fmt(assetPrice.bid)}</span></span>
                <span>Ask: <span className="text-green-400 font-mono">${fmt(assetPrice.ask)}</span></span>
                <span>Volume: <span className="text-foreground font-mono">{assetPrice.volume24h.toLocaleString()}</span></span>
              </div>
            )}
          </div>

          {/* Order form */}
          <div className="flex flex-col bg-card overflow-y-auto">
            <div className="px-4 py-3 border-b border-border shrink-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Passer un ordre</p>

              <div className="flex rounded-lg overflow-hidden border border-border">
                <button
                  onClick={() => setSide("buy")}
                  className={`flex-1 py-2 text-sm font-bold transition-colors ${
                    side === "buy"
                      ? "bg-green-500 text-white"
                      : "bg-transparent text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  ACHETER
                </button>
                <button
                  onClick={() => setSide("sell")}
                  className={`flex-1 py-2 text-sm font-bold transition-colors ${
                    side === "sell"
                      ? "bg-red-500 text-white"
                      : "bg-transparent text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  VENDRE
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Type d'ordre
                </Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {ORDER_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setOrderType(t.value)}
                      className={`py-1.5 text-xs rounded-md border font-medium transition-colors ${
                        orderType === t.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-transparent text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="quantity" className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Quantité
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="0.001"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="bg-background border-border font-mono"
                  step="0.001"
                  min="0"
                />
                <div className="flex gap-2 mt-1.5">
                  {["0.01", "0.1", "1", "10"].map((v) => (
                    <button
                      key={v}
                      onClick={() => setQuantity(v)}
                      className="text-xs text-primary hover:text-primary/80 font-medium"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="price" className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Prix ({orderType === "market" ? "marché" : "limite"})
                </Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={orderType === "market"}
                  className="bg-background border-border font-mono disabled:opacity-60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="sl" className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Stop Loss
                  </Label>
                  <Input
                    id="sl"
                    type="number"
                    placeholder="Optionnel"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    className="bg-background border-border font-mono text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="tp" className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Take Profit
                  </Label>
                  <Input
                    id="tp"
                    type="number"
                    placeholder="Optionnel"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                    className="bg-background border-border font-mono text-sm"
                  />
                </div>
              </div>

              {quantity && price && (
                <div className="bg-secondary/50 rounded-lg p-3 text-xs space-y-1.5 border border-border">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valeur estimée</span>
                    <span className="font-mono font-medium">${fmt(parseFloat(quantity || "0") * parseFloat(price || "0"))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Actif</span>
                    <span className="font-mono">{selectedSymbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mode</span>
                    <Badge variant="outline" className={`text-xs h-4 ${mode === "demo" ? "text-primary" : "text-green-400"}`}>
                      {mode === "demo" ? "DEMO" : "LIVE"}
                    </Badge>
                  </div>
                </div>
              )}

              {orderMessage && (
                <div className={`p-2.5 rounded-lg text-xs font-medium border ${
                  orderMessage.ok
                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                }`}>
                  {orderMessage.text}
                </div>
              )}

              <Button
                className={`w-full font-bold ${
                  side === "buy"
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : "bg-red-500 hover:bg-red-600 text-white"
                }`}
                onClick={handleOrder}
                disabled={createTrade.isPending}
              >
                {createTrade.isPending
                  ? "Traitement..."
                  : `${side === "buy" ? "Acheter" : "Vendre"} ${selectedSymbol}`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
