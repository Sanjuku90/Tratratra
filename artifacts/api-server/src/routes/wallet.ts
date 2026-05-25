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

// POST /api/wallet/deposit — creates a PENDING transaction (admin must approve)
router.post("/wallet/deposit", requireAuth, async (req: any, res) => {
  try {
    const { amount, method } = req.body;
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ error: "Montant invalide" });
    }
    if (numAmount < 10) {
      return res.status(400).json({ error: "Le dépôt minimum est de $10" });
    }

    const user = await getOrCreateUser(req.clerkId);

    await db.insert(transactionsTable).values({
      userId: user.id,
      type: "deposit",
      amount: numAmount.toString(),
      currency: "USD",
      status: "pending",
      description: `Dépôt via ${method ?? "crypto"} — en attente de validation`,
    });

    res.json({
      realBalance: parseFloat(user.realBalance),
      demoBalance: parseFloat(user.demoBalance),
      currency: "USD",
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/wallet/withdraw — deducts balance immediately, creates PENDING transaction
router.post("/wallet/withdraw", requireAuth, async (req: any, res) => {
  try {
    const { amount, method } = req.body;
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ error: "Montant invalide" });
    }

    const user = await getOrCreateUser(req.clerkId);
    if (parseFloat(user.realBalance) < numAmount) {
      return res.status(400).json({ error: "Solde insuffisant" });
    }

    const newBalance = parseFloat(user.realBalance) - numAmount;
    const [updated] = await db.update(usersTable)
      .set({ realBalance: newBalance.toString(), updatedAt: new Date() })
      .where(eq(usersTable.id, user.id))
      .returning();

    await db.insert(transactionsTable).values({
      userId: user.id,
      type: "withdrawal",
      amount: numAmount.toString(),
      currency: "USD",
      status: "pending",
      description: `Retrait via ${method ?? "crypto"} — en attente de validation`,
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
