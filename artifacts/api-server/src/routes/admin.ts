import { Router } from "express";
import { db, usersTable, transactionsTable } from "@workspace/db";
import { eq, and, or, inArray, desc } from "drizzle-orm";
import { requireAuth, getOrCreateUser } from "../lib/auth";

const router = Router();

const DEPOSIT_ADDRESS = "TAB1oeEKDS5NATwFAaUrTioDU9djX7anyS";
const MIN_DEPOSIT = 10;
const DEPOSIT_FEE = 1;

async function requireAdmin(req: any, res: any, next: any) {
  try {
    const user = await getOrCreateUser(req.clerkId);
    const adminEmail = process.env.ADMIN_EMAIL;
    const isAdmin = user.isAdmin || (adminEmail && user.email === adminEmail);
    if (!isAdmin) {
      return res.status(403).json({ error: "Forbidden — admin access required" });
    }
    (req as any).adminUser = user;
    next();
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
}

// GET /api/admin/transactions — all pending deposits/withdrawals with user info
router.get("/admin/transactions", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const txs = await db
      .select({
        id: transactionsTable.id,
        type: transactionsTable.type,
        amount: transactionsTable.amount,
        currency: transactionsTable.currency,
        status: transactionsTable.status,
        description: transactionsTable.description,
        adminNote: transactionsTable.adminNote,
        createdAt: transactionsTable.createdAt,
        userId: transactionsTable.userId,
        userEmail: usersTable.email,
        userDisplayName: usersTable.displayName,
      })
      .from(transactionsTable)
      .innerJoin(usersTable, eq(transactionsTable.userId, usersTable.id))
      .where(
        and(
          inArray(transactionsTable.type, ["deposit", "withdrawal"]),
        )
      )
      .orderBy(desc(transactionsTable.createdAt))
      .limit(200);

    res.json(
      txs.map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: parseFloat(tx.amount),
        currency: tx.currency,
        status: tx.status,
        description: tx.description ?? null,
        adminNote: tx.adminNote ?? null,
        createdAt: tx.createdAt.toISOString(),
        userId: tx.userId,
        userEmail: tx.userEmail,
        userDisplayName: tx.userDisplayName ?? null,
      }))
    );
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/transactions/:id/approve
router.post("/admin/transactions/:id/approve", requireAuth, requireAdmin, async (req, res) => {
  try {
    const txId = parseInt(req.params.id, 10);
    const [tx] = await db
      .select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, txId))
      .limit(1);

    if (!tx) return res.status(404).json({ error: "Transaction not found" });
    if (tx.status !== "pending") {
      return res.status(400).json({ error: "Transaction is not pending" });
    }
    if (tx.type !== "deposit" && tx.type !== "withdrawal") {
      return res.status(400).json({ error: "Only deposits and withdrawals can be approved" });
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, tx.userId))
      .limit(1);

    if (!user) return res.status(404).json({ error: "User not found" });

    if (tx.type === "deposit") {
      const netAmount = parseFloat(tx.amount) - DEPOSIT_FEE;
      if (netAmount <= 0) {
        return res.status(400).json({ error: "Amount too small after fees" });
      }
      const newBalance = parseFloat(user.realBalance) + netAmount;
      await db
        .update(usersTable)
        .set({ realBalance: newBalance.toString(), updatedAt: new Date() })
        .where(eq(usersTable.id, user.id));
    }

    const [updated] = await db
      .update(transactionsTable)
      .set({ status: "completed", adminNote: "Approuvé par l'administrateur" })
      .where(eq(transactionsTable.id, txId))
      .returning();

    const [userRow] = await db
      .select({ email: usersTable.email, displayName: usersTable.displayName })
      .from(usersTable)
      .where(eq(usersTable.id, updated.userId))
      .limit(1);

    res.json({
      id: updated.id,
      type: updated.type,
      amount: parseFloat(updated.amount),
      currency: updated.currency,
      status: updated.status,
      description: updated.description ?? null,
      adminNote: updated.adminNote ?? null,
      createdAt: updated.createdAt.toISOString(),
      userId: updated.userId,
      userEmail: userRow?.email ?? "",
      userDisplayName: userRow?.displayName ?? null,
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/transactions/:id/reject
router.post("/admin/transactions/:id/reject", requireAuth, requireAdmin, async (req, res) => {
  try {
    const txId = parseInt(req.params.id, 10);
    const note: string = req.body?.note ?? "Rejeté par l'administrateur";

    const [tx] = await db
      .select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, txId))
      .limit(1);

    if (!tx) return res.status(404).json({ error: "Transaction not found" });
    if (tx.status !== "pending") {
      return res.status(400).json({ error: "Transaction is not pending" });
    }

    if (tx.type === "withdrawal") {
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, tx.userId))
        .limit(1);

      if (user) {
        const restoredBalance = parseFloat(user.realBalance) + parseFloat(tx.amount);
        await db
          .update(usersTable)
          .set({ realBalance: restoredBalance.toString(), updatedAt: new Date() })
          .where(eq(usersTable.id, user.id));
      }
    }

    const [updated] = await db
      .update(transactionsTable)
      .set({ status: "failed", adminNote: note })
      .where(eq(transactionsTable.id, txId))
      .returning();

    const [userRow] = await db
      .select({ email: usersTable.email, displayName: usersTable.displayName })
      .from(usersTable)
      .where(eq(usersTable.id, updated.userId))
      .limit(1);

    res.json({
      id: updated.id,
      type: updated.type,
      amount: parseFloat(updated.amount),
      currency: updated.currency,
      status: updated.status,
      description: updated.description ?? null,
      adminNote: updated.adminNote ?? null,
      createdAt: updated.createdAt.toISOString(),
      userId: updated.userId,
      userEmail: userRow?.email ?? "",
      userDisplayName: userRow?.displayName ?? null,
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/users
router.get("/admin/users", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const users = await db
      .select()
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt));

    res.json(
      users.map((u) => ({
        id: u.id,
        email: u.email,
        displayName: u.displayName ?? null,
        tradingMode: u.tradingMode,
        realBalance: parseFloat(u.realBalance),
        demoBalance: parseFloat(u.demoBalance),
        isAdmin: u.isAdmin,
        createdAt: u.createdAt.toISOString(),
      }))
    );
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/admin/users/:id/toggle-admin
router.patch("/admin/users/:id/toggle-admin", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    if (userId === req.adminUser.id) {
      return res.status(400).json({ error: "Cannot modify your own admin status" });
    }

    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!existing) return res.status(404).json({ error: "User not found" });

    const [updated] = await db
      .update(usersTable)
      .set({ isAdmin: !existing.isAdmin, updatedAt: new Date() })
      .where(eq(usersTable.id, userId))
      .returning();

    res.json({
      id: updated.id,
      email: updated.email,
      displayName: updated.displayName ?? null,
      tradingMode: updated.tradingMode,
      realBalance: parseFloat(updated.realBalance),
      demoBalance: parseFloat(updated.demoBalance),
      isAdmin: updated.isAdmin,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export { DEPOSIT_ADDRESS, MIN_DEPOSIT, DEPOSIT_FEE };
export default router;
