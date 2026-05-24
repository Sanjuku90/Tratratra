import { Router } from "express";
import { db, tradesTable, usersTable, transactionsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, getOrCreateUser } from "../lib/auth";
import { getAssetPriceData, getAssetBySymbol } from "../lib/marketData";

const router = Router();

function formatTrade(t: any) {
  return {
    id: t.id,
    symbol: t.symbol,
    assetName: t.assetName,
    side: t.side,
    orderType: t.orderType,
    quantity: parseFloat(t.quantity),
    price: parseFloat(t.price),
    executedPrice: t.executedPrice ? parseFloat(t.executedPrice) : null,
    stopLoss: t.stopLoss ? parseFloat(t.stopLoss) : null,
    takeProfit: t.takeProfit ? parseFloat(t.takeProfit) : null,
    status: t.status,
    pnl: t.pnl ? parseFloat(t.pnl) : null,
    mode: t.mode,
    createdAt: t.createdAt.toISOString(),
    closedAt: t.closedAt ? t.closedAt.toISOString() : null,
  };
}

// GET /api/trades/:mode
router.get("/trades/:mode", requireAuth, async (req: any, res) => {
  try {
    const { mode } = req.params;
    if (mode !== "real" && mode !== "demo") return res.status(400).json({ error: "Invalid mode" });
    const user = await getOrCreateUser(req.clerkId);
    const trades = await db.select().from(tradesTable)
      .where(and(eq(tradesTable.userId, user.id), eq(tradesTable.mode, mode)))
      .orderBy(desc(tradesTable.createdAt))
      .limit(100);
    res.json(trades.map(formatTrade));
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/trades
router.post("/trades", requireAuth, async (req: any, res) => {
  try {
    const { symbol, side, orderType, quantity, price, stopLoss, takeProfit, mode } = req.body;
    if (!symbol || !side || !orderType || !quantity || !price || !mode) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const user = await getOrCreateUser(req.clerkId);
    const priceData = getAssetPriceData(symbol);
    if (!priceData) return res.status(404).json({ error: "Asset not found" });

    const asset = getAssetBySymbol(symbol);
    const executedPrice = orderType === "market" ? priceData.price : null;
    const status = orderType === "market" ? "open" : "pending";

    // For real mode, check balance
    if (mode === "real") {
      const cost = parseFloat(quantity) * priceData.price;
      if (parseFloat(user.realBalance) < cost) {
        return res.status(400).json({ error: "Insufficient real balance" });
      }
    } else {
      const cost = parseFloat(quantity) * priceData.price;
      if (parseFloat(user.demoBalance) < cost) {
        return res.status(400).json({ error: "Insufficient demo balance" });
      }
    }

    const [trade] = await db.insert(tradesTable).values({
      userId: user.id,
      symbol,
      assetName: asset?.name ?? symbol,
      side,
      orderType,
      quantity: quantity.toString(),
      price: price.toString(),
      executedPrice: executedPrice?.toString() ?? null,
      stopLoss: stopLoss?.toString() ?? null,
      takeProfit: takeProfit?.toString() ?? null,
      status,
      mode,
    }).returning();

    // Deduct balance for market orders
    if (orderType === "market") {
      const cost = parseFloat(quantity) * priceData.price;
      if (mode === "real") {
        const newBalance = Math.max(0, parseFloat(user.realBalance) - cost);
        await db.update(usersTable).set({ realBalance: newBalance.toString(), updatedAt: new Date() }).where(eq(usersTable.id, user.id));
      } else {
        const newBalance = Math.max(0, parseFloat(user.demoBalance) - cost);
        await db.update(usersTable).set({ demoBalance: newBalance.toString(), updatedAt: new Date() }).where(eq(usersTable.id, user.id));
      }

      await db.insert(transactionsTable).values({
        userId: user.id,
        type: "trade_buy",
        amount: (parseFloat(quantity) * priceData.price).toString(),
        currency: "USD",
        status: "completed",
        description: `${side.toUpperCase()} ${quantity} ${symbol} @ ${priceData.price.toFixed(4)}`,
      });
    }

    res.status(201).json(formatTrade(trade));
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/trades/:mode/open
router.get("/trades/:mode/open", requireAuth, async (req: any, res) => {
  try {
    const { mode } = req.params;
    if (mode !== "real" && mode !== "demo") return res.status(400).json({ error: "Invalid mode" });
    const user = await getOrCreateUser(req.clerkId);

    const openTrades = await db.select().from(tradesTable)
      .where(and(eq(tradesTable.userId, user.id), eq(tradesTable.mode, mode), eq(tradesTable.status, "open")));

    const positions = openTrades.map(t => {
      const priceData = getAssetPriceData(t.symbol);
      const currentPrice = priceData?.price ?? parseFloat(t.price);
      const qty = parseFloat(t.quantity);
      const entryPrice = parseFloat(t.executedPrice ?? t.price);
      const rawPnl = t.side === "buy"
        ? (currentPrice - entryPrice) * qty
        : (entryPrice - currentPrice) * qty;
      const pnlPercent = (rawPnl / (entryPrice * qty)) * 100;

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

    res.json(positions);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/trades/order/:id  — cancel a pending order only
router.delete("/trades/order/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = await getOrCreateUser(req.clerkId);

    const [trade] = await db.select().from(tradesTable)
      .where(and(eq(tradesTable.id, id), eq(tradesTable.userId, user.id)));

    if (!trade) return res.status(404).json({ error: "Trade not found" });
    if (trade.status !== "pending") {
      return res.status(400).json({ error: "Only pending orders can be cancelled this way" });
    }

    const [cancelled] = await db.update(tradesTable)
      .set({ status: "cancelled", closedAt: new Date() })
      .where(eq(tradesTable.id, id))
      .returning();

    res.json(formatTrade(cancelled));
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/trades/position/:id/close  — close an open position at market price, realise P&L
router.post("/trades/position/:id/close", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = await getOrCreateUser(req.clerkId);

    const [trade] = await db.select().from(tradesTable)
      .where(and(eq(tradesTable.id, id), eq(tradesTable.userId, user.id)));

    if (!trade) return res.status(404).json({ error: "Trade not found" });
    if (trade.status !== "open") {
      return res.status(400).json({ error: "Only open positions can be closed" });
    }

    const priceData = getAssetPriceData(trade.symbol);
    const closePrice = priceData?.price ?? parseFloat(trade.executedPrice ?? trade.price);
    const qty = parseFloat(trade.quantity);
    const entryPrice = parseFloat(trade.executedPrice ?? trade.price);

    const pnl = trade.side === "buy"
      ? (closePrice - entryPrice) * qty
      : (entryPrice - closePrice) * qty;

    // Restore original cost + realised P&L to user balance
    const originalCost = entryPrice * qty;
    const returnAmount = originalCost + pnl;

    const mode = trade.mode as "real" | "demo";
    if (mode === "real") {
      const newBalance = Math.max(0, parseFloat(user.realBalance) + returnAmount);
      await db.update(usersTable).set({ realBalance: newBalance.toString(), updatedAt: new Date() }).where(eq(usersTable.id, user.id));
    } else {
      const newBalance = Math.max(0, parseFloat(user.demoBalance) + returnAmount);
      await db.update(usersTable).set({ demoBalance: newBalance.toString(), updatedAt: new Date() }).where(eq(usersTable.id, user.id));
    }

    const [closed] = await db.update(tradesTable)
      .set({ status: "closed", pnl: pnl.toString(), closedAt: new Date() })
      .where(eq(tradesTable.id, id))
      .returning();

    await db.insert(transactionsTable).values({
      userId: user.id,
      type: "trade_sell",
      amount: Math.abs(returnAmount).toString(),
      currency: "USD",
      status: "completed",
      description: `Closed ${qty} ${trade.symbol} @ ${closePrice.toFixed(4)} | P&L: ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}`,
    });

    res.json({ ...formatTrade(closed), closedPrice: closePrice, pnl });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
