// Simulated market data service — generates realistic price movements

const ASSETS = [
  { symbol: "BTC", name: "Bitcoin", category: "crypto" as const, basePrice: 67450, logoUrl: null },
  { symbol: "ETH", name: "Ethereum", category: "crypto" as const, basePrice: 3580, logoUrl: null },
  { symbol: "SOL", name: "Solana", category: "crypto" as const, basePrice: 178, logoUrl: null },
  { symbol: "BNB", name: "BNB", category: "crypto" as const, basePrice: 612, logoUrl: null },
  { symbol: "XRP", name: "XRP", category: "crypto" as const, basePrice: 0.62, logoUrl: null },
  { symbol: "DOGE", name: "Dogecoin", category: "crypto" as const, basePrice: 0.165, logoUrl: null },
  { symbol: "EUR/USD", name: "Euro / US Dollar", category: "forex" as const, basePrice: 1.0850, logoUrl: null },
  { symbol: "GBP/USD", name: "British Pound / US Dollar", category: "forex" as const, basePrice: 1.2710, logoUrl: null },
  { symbol: "USD/JPY", name: "US Dollar / Japanese Yen", category: "forex" as const, basePrice: 149.85, logoUrl: null },
  { symbol: "USD/CHF", name: "US Dollar / Swiss Franc", category: "forex" as const, basePrice: 0.8980, logoUrl: null },
  { symbol: "AAPL", name: "Apple Inc.", category: "stocks" as const, basePrice: 189.50, logoUrl: null },
  { symbol: "TSLA", name: "Tesla Inc.", category: "stocks" as const, basePrice: 245.80, logoUrl: null },
  { symbol: "MSFT", name: "Microsoft Corp.", category: "stocks" as const, basePrice: 415.20, logoUrl: null },
  { symbol: "NVDA", name: "NVIDIA Corp.", category: "stocks" as const, basePrice: 875.30, logoUrl: null },
  { symbol: "AMZN", name: "Amazon.com Inc.", category: "stocks" as const, basePrice: 192.70, logoUrl: null },
  { symbol: "XAU/USD", name: "Gold / US Dollar", category: "commodities" as const, basePrice: 2345.60, logoUrl: null },
  { symbol: "XAG/USD", name: "Silver / US Dollar", category: "commodities" as const, basePrice: 28.45, logoUrl: null },
  { symbol: "OIL", name: "Crude Oil WTI", category: "commodities" as const, basePrice: 78.90, logoUrl: null },
];

// Deterministic jitter using symbol seed
function symbolSeed(symbol: string): number {
  let h = 0;
  for (let i = 0; i < symbol.length; i++) h = (Math.imul(31, h) + symbol.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function getPrice(symbol: string): number {
  const asset = ASSETS.find(a => a.symbol === symbol);
  if (!asset) return 100;
  const seed = symbolSeed(symbol);
  const t = Date.now() / 1000;
  // Oscillating price with a minute-scale cycle
  const noise = Math.sin(t / 60 + seed) * 0.003 + Math.sin(t / 300 + seed * 2) * 0.008;
  return asset.basePrice * (1 + noise);
}

function getChange24h(symbol: string): { change: number; changePercent: number } {
  const seed = symbolSeed(symbol);
  const change = ((seed % 1000) / 1000 - 0.5) * 8; // -4% to +4%
  const price = getPrice(symbol);
  return { change: (price * change) / 100, changePercent: change };
}

export function getAllAssets() {
  return ASSETS.map(asset => {
    const price = getPrice(asset.symbol);
    const { change, changePercent } = getChange24h(asset.symbol);
    const seed = symbolSeed(asset.symbol);
    return {
      symbol: asset.symbol,
      name: asset.name,
      category: asset.category,
      currentPrice: price,
      change24h: change,
      change24hPercent: changePercent,
      volume24h: ((seed % 10000) + 1000) * price * 0.1,
      logoUrl: asset.logoUrl,
    };
  });
}

export function getAssetBySymbol(symbol: string) {
  return ASSETS.find(a => a.symbol === symbol) ?? null;
}

export function getAssetPriceData(symbol: string) {
  const asset = ASSETS.find(a => a.symbol === symbol);
  if (!asset) return null;
  const price = getPrice(symbol);
  const { change, changePercent } = getChange24h(symbol);
  const spread = price * 0.0002;
  const seed = symbolSeed(symbol);
  return {
    symbol,
    price,
    bid: price - spread / 2,
    ask: price + spread / 2,
    change24h: change,
    change24hPercent: changePercent,
    high24h: price * (1 + Math.abs(changePercent / 100) + 0.01),
    low24h: price * (1 - Math.abs(changePercent / 100) - 0.01),
    volume24h: ((seed % 10000) + 1000) * price * 0.1,
    updatedAt: new Date().toISOString(),
  };
}

export function generateCandles(symbol: string, limit = 100): Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }> {
  const asset = ASSETS.find(a => a.symbol === symbol);
  const basePrice = asset?.basePrice ?? 100;
  const seed = symbolSeed(symbol);
  const now = Math.floor(Date.now() / 1000);
  const intervalSecs = 3600; // 1h candles

  const candles = [];
  let price = basePrice;
  for (let i = limit; i >= 0; i--) {
    const t = now - i * intervalSecs;
    const open = price;
    const changePercent = (Math.sin(t / 3600 + seed) * 0.015) + ((seed % 100) / 10000 - 0.005);
    const close = open * (1 + changePercent);
    const high = Math.max(open, close) * (1 + Math.random() * 0.005);
    const low = Math.min(open, close) * (1 - Math.random() * 0.005);
    const volume = ((seed % 1000) + 100) * basePrice * (0.5 + Math.random());
    candles.push({ time: t, open, high, low, close, volume });
    price = close;
  }
  return candles;
}

export { ASSETS };
