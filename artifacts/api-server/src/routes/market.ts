import { Router } from "express";
import { db, watchlistTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, getOrCreateUser } from "../lib/auth";
import { getAllAssets, getAssetPriceData, generateCandles, getAssetBySymbol } from "../lib/marketData";

const router = Router();

// GET /api/market/assets
router.get("/market/assets", async (_req, res) => {
  try {
    const assets = getAllAssets();
    res.json(assets);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/market/assets/:symbol/price
router.get("/market/assets/:symbol/price", async (req, res) => {
  try {
    const { symbol } = req.params;
    const price = getAssetPriceData(decodeURIComponent(symbol));
    if (!price) return res.status(404).json({ error: "Asset not found" });
    res.json(price);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/market/assets/:symbol/candles
router.get("/market/assets/:symbol/candles", async (req, res) => {
  try {
    const { symbol } = req.params;
    const candles = generateCandles(decodeURIComponent(symbol), 100);
    res.json(candles);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/market/watchlist
router.get("/market/watchlist", requireAuth, async (req: any, res) => {
  try {
    const user = await getOrCreateUser(req.clerkId);
    const items = await db.select().from(watchlistTable).where(eq(watchlistTable.userId, user.id));

    const result = items.map(item => {
      const data = getAssetPriceData(item.symbol);
      if (!data) return null;
      const asset = getAssetBySymbol(item.symbol);
      return {
        symbol: item.symbol,
        name: asset?.name ?? item.symbol,
        category: asset?.category ?? "crypto",
        currentPrice: data.price,
        change24h: data.change24h,
        change24hPercent: data.change24hPercent,
      };
    }).filter(Boolean);

    res.json(result);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/market/watchlist
router.post("/market/watchlist", requireAuth, async (req: any, res) => {
  try {
    const { symbol } = req.body;
    if (!symbol) return res.status(400).json({ error: "Symbol required" });

    const asset = getAssetBySymbol(symbol);
    if (!asset) return res.status(404).json({ error: "Asset not found" });

    const user = await getOrCreateUser(req.clerkId);

    try {
      await db.insert(watchlistTable).values({ userId: user.id, symbol }).onConflictDoNothing();
    } catch {
      // Already in watchlist — ignore
    }

    const data = getAssetPriceData(symbol)!;
    res.status(201).json({
      symbol,
      name: asset.name,
      category: asset.category,
      currentPrice: data.price,
      change24h: data.change24h,
      change24hPercent: data.change24hPercent,
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/market/watchlist/:symbol
router.delete("/market/watchlist/:symbol", requireAuth, async (req: any, res) => {
  try {
    const { symbol } = req.params;
    const user = await getOrCreateUser(req.clerkId);
    await db.delete(watchlistTable).where(
      and(eq(watchlistTable.userId, user.id), eq(watchlistTable.symbol, decodeURIComponent(symbol)))
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
