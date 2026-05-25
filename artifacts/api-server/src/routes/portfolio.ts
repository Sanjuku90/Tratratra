import { Router } from "express";
import { db, tradesTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { requireAuth, getOrCreateUser } from "../lib/auth";
import { getAssetPriceData } from "../lib/marketData";

const router = Router();

// GET /api/portfolio/:mode
router.get("/portfolio/:mode", requireAuth, async (req: any, res) => {
  try {
    const { mode } = req.params;
    if (mode !== "real" && mode !== "demo") return res.status(400).json({ error: "Invalid mode" });

    const user = await getOrCreateUser(req.clerkId);
    const openTrades = await db.select().from(tradesTable)
      .where(and(eq(tradesTable.userId, user.id), eq(tradesTable.mode, mode), eq(tradesTable.status, "open")));

    let totalValue = mode === "real" ? parseFloat(user.realBalance) : parseFloat(user.demoBalance);
    let totalPnl = 0;
    let totalCost = 0;

    const positions = openTrades.map(t => {
      const priceData = getAssetPriceData(t.symbol);
      const currentPrice = priceData?.price ?? parseFloat(t.price);
      const qty = parseFloat(t.quantity);
      const entryPrice = parseFloat(t.executedPrice ?? t.price);
      const positionValue = currentPrice * qty;
      const rawPnl = t.side === "buy" ? (currentPrice - entryPrice) * qty : (entryPrice - currentPrice) * qty;
      const pnlPercent = entryPrice > 0 ? (rawPnl / (entryPrice * qty)) * 100 : 0;

      totalValue += positionValue;
      totalPnl += rawPnl;
      totalCost += entryPrice * qty;

      return {
        id: t.id,
        symbol: t.symbol,
        assetName: t.assetName,
        side: t.side,
        quantity: qty,
        entryPrice,
        currentPrice,
        pnl: rawPnl,
        pnlPercent,
        mode: t.mode,
        openedAt: t.createdAt.toISOString(),
      };
    });

    const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

    res.json({ totalValue, totalPnl, totalPnlPercent, positions, mode });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/portfolio/:mode/summary
router.get("/portfolio/:mode/summary", requireAuth, async (req: any, res) => {
  try {
    const { mode } = req.params;
    if (mode !== "real" && mode !== "demo") return res.status(400).json({ error: "Invalid mode" });

    const user = await getOrCreateUser(req.clerkId);

    const allTrades = await db.select().from(tradesTable)
      .where(and(eq(tradesTable.userId, user.id), eq(tradesTable.mode, mode)));

    const closedTrades = allTrades.filter(t => t.status === "closed");
    const openTrades = allTrades.filter(t => t.status === "open");

    let totalPnl = 0;
    let totalCost = 0;
    let wins = 0;
    let bestTrade: number | null = null;
    let worstTrade: number | null = null;

    const openPositionValues = openTrades.map(t => {
      const priceData = getAssetPriceData(t.symbol);
      const currentPrice = priceData?.price ?? parseFloat(t.price);
      const qty = parseFloat(t.quantity);
      const entryPrice = parseFloat(t.executedPrice ?? t.price);
      const rawPnl = t.side === "buy" ? (currentPrice - entryPrice) * qty : (entryPrice - currentPrice) * qty;
      totalPnl += rawPnl;
      totalCost += entryPrice * qty;
      return currentPrice * qty;
    });

    closedTrades.forEach(t => {
      const pnl = t.pnl ? parseFloat(t.pnl) : 0;
      totalPnl += pnl;
      totalCost += parseFloat(t.price) * parseFloat(t.quantity);
      if (pnl > 0) wins++;
      if (bestTrade === null || pnl > bestTrade) bestTrade = pnl;
      if (worstTrade === null || pnl < worstTrade) worstTrade = pnl;
    });

    const balance = mode === "real" ? parseFloat(user.realBalance) : parseFloat(user.demoBalance);
    const totalValue = balance + openPositionValues.reduce((a, b) => a + b, 0);
    const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
    const dayChange = totalPnl * 0.3; // simplified day change
    const dayChangePercent = totalPnlPercent * 0.3;
    const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;

    res.json({
      totalValue,
      dayChange,
      dayChangePercent,
      totalPnl,
      totalPnlPercent,
      winRate,
      totalTrades: allTrades.length,
      openPositions: openTrades.length,
      bestTrade,
      worstTrade,
      mode,
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/portfolio/:mode/pnl-history
router.get("/portfolio/:mode/pnl-history", requireAuth, async (req: any, res) => {
  try {
    const { mode } = req.params;
    if (mode !== "real" && mode !== "demo") return res.status(400).json({ error: "Invalid mode" });

    const user = await getOrCreateUser(req.clerkId);
    const startingBalance = mode === "demo" ? 100000 : 0;

    const allTrades = await db.select().from(tradesTable)
      .where(and(eq(tradesTable.userId, user.id), eq(tradesTable.mode, mode)))
      .orderBy(asc(tradesTable.createdAt));

    const closedTrades = allTrades.filter(t => t.status === "closed" && t.closedAt);
    const openTrades = allTrades.filter(t => t.status === "open");

    // Build timeline: starting point + each closed trade
    const points: Array<{ date: string; portfolioValue: number; pnl: number; label: string }> = [];

    const accountCreatedAt = user.createdAt;
    let cumulativePnl = 0;

    // Starting point
    points.push({
      date: accountCreatedAt.toISOString(),
      portfolioValue: startingBalance,
      pnl: 0,
      label: "Début",
    });

    // Each closed trade adds a data point
    for (const trade of closedTrades) {
      const pnl = trade.pnl ? parseFloat(trade.pnl) : 0;
      cumulativePnl += pnl;
      points.push({
        date: trade.closedAt!.toISOString(),
        portfolioValue: startingBalance + cumulativePnl,
        pnl: cumulativePnl,
        label: `${trade.symbol} ${trade.side}`,
      });
    }

    // Add current point with unrealized P&L from open positions
    let unrealizedPnl = 0;
    for (const trade of openTrades) {
      const priceData = getAssetPriceData(trade.symbol);
      const currentPrice = priceData?.price ?? parseFloat(trade.price);
      const qty = parseFloat(trade.quantity);
      const entryPrice = parseFloat(trade.executedPrice ?? trade.price);
      const rawPnl = trade.side === "buy"
        ? (currentPrice - entryPrice) * qty
        : (entryPrice - currentPrice) * qty;
      unrealizedPnl += rawPnl;
    }

    if (openTrades.length > 0 || closedTrades.length > 0) {
      points.push({
        date: new Date().toISOString(),
        portfolioValue: startingBalance + cumulativePnl + unrealizedPnl,
        pnl: cumulativePnl + unrealizedPnl,
        label: "Maintenant",
      });
    }

    const currentBalance = mode === "real" ? parseFloat(user.realBalance) : parseFloat(user.demoBalance);
    const totalPnl = cumulativePnl + unrealizedPnl;
    const totalPnlPercent = startingBalance > 0 ? (totalPnl / startingBalance) * 100 : 0;

    res.json({
      points,
      currentBalance,
      totalPnl,
      totalPnlPercent,
      realizedPnl: cumulativePnl,
      unrealizedPnl,
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
