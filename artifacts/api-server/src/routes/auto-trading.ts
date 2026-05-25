import { Router } from "express";
import { db, usersTable, autoSubscriptionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, getOrCreateUser } from "../lib/auth";

const router = Router();

export const AUTO_TRADING_PLANS = [
  {
    id: "starter",
    name: "Starter",
    minDeposit: 49.99,
    monthlyReturnMin: 5,
    monthlyReturnMax: 10,
    color: "bronze",
    description: "Idéal pour commencer le trading automatique sans risque élevé",
    features: [
      "Risque conservateur maîtrisé",
      "Gestion algorithmique 24/7",
      "Rapport de performance hebdomadaire",
      "Support par email",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    minDeposit: 199,
    monthlyReturnMin: 10,
    monthlyReturnMax: 20,
    color: "silver",
    description: "Pour les investisseurs qui veulent accélérer la croissance de leur capital",
    features: [
      "Multi-actifs (Crypto + Forex)",
      "Algorithmes avancés ML",
      "Rapport quotidien détaillé",
      "Support prioritaire",
    ],
  },
  {
    id: "elite",
    name: "Elite",
    minDeposit: 499,
    monthlyReturnMin: 20,
    monthlyReturnMax: 30,
    color: "gold",
    description: "Nos meilleurs algorithmes pour des performances exceptionnelles",
    features: [
      "IA propriétaire haute fréquence",
      "Hedging automatique du risque",
      "Accès tableau de bord VIP",
      "Support téléphonique 24/7",
    ],
  },
  {
    id: "vip",
    name: "VIP",
    minDeposit: 1999,
    monthlyReturnMin: 30,
    monthlyReturnMax: 50,
    color: "platinum",
    description: "Notre offre premium exclusive pour investisseurs à fort potentiel",
    features: [
      "Gestionnaire de compte dédié",
      "Stratégies exclusives propriétaires",
      "Rendements maximaux garantis",
      "Ligne directe privée",
    ],
  },
] as const;

// GET /api/auto-trading/plans
router.get("/auto-trading/plans", async (_req, res) => {
  res.json(AUTO_TRADING_PLANS);
});

// GET /api/auto-trading/subscriptions
router.get("/auto-trading/subscriptions", requireAuth, async (req: any, res) => {
  try {
    const user = await getOrCreateUser(req.clerkId);
    const subs = await db
      .select()
      .from(autoSubscriptionsTable)
      .where(eq(autoSubscriptionsTable.userId, user.id))
      .orderBy(desc(autoSubscriptionsTable.createdAt));

    res.json(subs.map(mapSub));
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auto-trading/subscriptions
router.post("/auto-trading/subscriptions", requireAuth, async (req: any, res) => {
  try {
    const { planId, amount, riskLevel, targetAssets, durationMonths } = req.body;

    const plan = AUTO_TRADING_PLANS.find((p) => p.id === planId);
    if (!plan) return res.status(400).json({ error: "Plan invalide" });

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < plan.minDeposit) {
      return res.status(400).json({
        error: `Le dépôt minimum pour le plan ${plan.name} est de $${plan.minDeposit}`,
      });
    }

    const user = await getOrCreateUser(req.clerkId);

    const [sub] = await db
      .insert(autoSubscriptionsTable)
      .values({
        userId: user.id,
        planId: planId as "starter" | "pro" | "elite" | "vip",
        planName: plan.name,
        amount: numAmount.toString(),
        riskLevel: riskLevel ?? "moderate",
        targetAssets: targetAssets ?? "mixed",
        durationMonths: durationMonths ?? 1,
        status: "pending",
        currentProfit: "0",
      })
      .returning();

    res.status(201).json(mapSub(sub));
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

function mapSub(s: typeof autoSubscriptionsTable.$inferSelect) {
  return {
    id: s.id,
    planId: s.planId,
    planName: s.planName,
    amount: parseFloat(s.amount),
    riskLevel: s.riskLevel,
    targetAssets: s.targetAssets,
    durationMonths: s.durationMonths,
    status: s.status,
    currentProfit: parseFloat(s.currentProfit),
    adminNote: s.adminNote ?? null,
    activatedAt: s.activatedAt?.toISOString() ?? null,
    expiresAt: s.expiresAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
  };
}

export { mapSub };
export default router;
