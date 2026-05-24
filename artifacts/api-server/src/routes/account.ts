import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, getOrCreateUser } from "../lib/auth";

const router = Router();

// GET /api/account/me
router.get("/account/me", requireAuth, async (req: any, res) => {
  try {
    const clerkId = req.clerkId;
    const auth = getAuth(req);
    // Get email from Clerk session claims if available
    const email = (auth?.sessionClaims?.email as string) ?? undefined;
    const user = await getOrCreateUser(clerkId, email);

    res.json({
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      displayName: user.displayName ?? null,
      tradingMode: user.tradingMode,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/account/me
router.patch("/account/me", requireAuth, async (req: any, res) => {
  try {
    const clerkId = req.clerkId;
    const { displayName, tradingMode } = req.body;

    const existing = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId)).limit(1);
    if (!existing.length) return res.status(404).json({ error: "User not found" });

    const updates: Partial<{ displayName: string; tradingMode: "real" | "demo"; updatedAt: Date }> = {
      updatedAt: new Date(),
    };
    if (displayName !== undefined) updates.displayName = displayName;
    if (tradingMode !== undefined) updates.tradingMode = tradingMode;

    const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.clerkId, clerkId)).returning();

    res.json({
      id: updated.id,
      clerkId: updated.clerkId,
      email: updated.email,
      displayName: updated.displayName ?? null,
      tradingMode: updated.tradingMode,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
