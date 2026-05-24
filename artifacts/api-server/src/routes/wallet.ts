import { Router } from "express";
import { db, usersTable, transactionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, getOrCreateUser } from "../lib/auth";

const router = Router();

// GET /api/wallet/balance
router.get("/wallet/balance", requireAuth, async (req: any, res) => {
  try {
    const user = await getOrCreateUser(req.clerkId);
    res.json({
      realBalance: parseFloat(user.realBalance),
      demoBalance: parseFloat(user.demoBalance),
      currency: "USD",
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/wallet/deposit
router.post("/wallet/deposit", requireAuth, async (req: any, res) => {
  try {
    const { amount, method } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid amount" });

    const user = await getOrCreateUser(req.clerkId);
    const newBalance = parseFloat(user.realBalance) + parseFloat(amount);

    const [updated] = await db.update(usersTable)
      .set({ realBalance: newBalance.toString(), updatedAt: new Date() })
      .where(eq(usersTable.id, user.id))
      .returning();

    await db.insert(transactionsTable).values({
      userId: user.id,
      type: "deposit",
      amount: amount.toString(),
      currency: "USD",
      status: "completed",
      description: `Deposit via ${method ?? "card"}`,
    });

    res.json({
      realBalance: parseFloat(updated.realBalance),
      demoBalance: parseFloat(updated.demoBalance),
      currency: "USD",
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/wallet/withdraw
router.post("/wallet/withdraw", requireAuth, async (req: any, res) => {
  try {
    const { amount, method } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid amount" });

    const user = await getOrCreateUser(req.clerkId);
    if (parseFloat(user.realBalance) < parseFloat(amount)) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    const newBalance = parseFloat(user.realBalance) - parseFloat(amount);
    const [updated] = await db.update(usersTable)
      .set({ realBalance: newBalance.toString(), updatedAt: new Date() })
      .where(eq(usersTable.id, user.id))
      .returning();

    await db.insert(transactionsTable).values({
      userId: user.id,
      type: "withdrawal",
      amount: amount.toString(),
      currency: "USD",
      status: "completed",
      description: `Withdrawal via ${method ?? "bank_transfer"}`,
    });

    res.json({
      realBalance: parseFloat(updated.realBalance),
      demoBalance: parseFloat(updated.demoBalance),
      currency: "USD",
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/wallet/transactions
router.get("/wallet/transactions", requireAuth, async (req: any, res) => {
  try {
    const user = await getOrCreateUser(req.clerkId);
    const txs = await db.select().from(transactionsTable)
      .where(eq(transactionsTable.userId, user.id))
      .orderBy(desc(transactionsTable.createdAt))
      .limit(50);

    res.json(txs.map(tx => ({
      id: tx.id,
      type: tx.type,
      amount: parseFloat(tx.amount),
      currency: tx.currency,
      status: tx.status,
      description: tx.description ?? null,
      createdAt: tx.createdAt.toISOString(),
    })));
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
