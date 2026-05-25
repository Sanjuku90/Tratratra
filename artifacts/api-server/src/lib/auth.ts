import { getAuth } from "@clerk/express";
import { db, usersTable, transactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  (req as any).clerkId = clerkId;
  next();
};

const DEMO_STARTING_BALANCE = "100000";

export const getOrCreateUser = async (clerkId: string, email?: string) => {
  const existing = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId)).limit(1);
  if (existing.length > 0) return existing[0];

  const [newUser] = await db.insert(usersTable).values({
    clerkId,
    email: email ?? `${clerkId}@unknown.com`,
    tradingMode: "demo",
    demoBalance: DEMO_STARTING_BALANCE,
  }).returning();

  await db.insert(transactionsTable).values({
    userId: newUser.id,
    type: "deposit",
    amount: DEMO_STARTING_BALANCE,
    currency: "USD",
    status: "completed",
    description: "Welcome bonus — Demo account funded with $100,000 virtual cash",
  });

  return newUser;
};
