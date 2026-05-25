import { db, assetsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { ASSETS } from "./marketData";
import { logger } from "./logger";

export async function seedDatabase(): Promise<void> {
  try {
    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(assetsTable);

    if (Number(row?.count) > 0) {
      logger.info("Database already seeded — skipping");
      return;
    }

    logger.info("Seeding database with assets...");

    await db.insert(assetsTable).values(
      ASSETS.map((asset) => ({
        symbol: asset.symbol,
        name: asset.name,
        category: asset.category,
        basePrice: String(asset.basePrice),
        logoUrl: asset.logoUrl ?? null,
      })),
    );

    logger.info({ count: ASSETS.length }, "Database seeded successfully");
  } catch (err) {
    logger.error({ err }, "Failed to seed database — continuing anyway");
  }
}
