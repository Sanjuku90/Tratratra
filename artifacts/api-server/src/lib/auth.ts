import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
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

export const getOrCreateUser = async (clerkId: string, email?: string) => {
  const existing = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId)).limit(1);
  if (existing.length > 0) return existing[0];

  const [newUser] = await db.insert(usersTable).values({
    clerkId,
    email: email ?? `${clerkId}@unknown.com`,
    tradingMode: "demo",
  }).returning();
  return newUser;
};
