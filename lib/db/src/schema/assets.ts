import { pgTable, text, serial, numeric, pgEnum, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const assetCategoryEnum = pgEnum("asset_category", ["crypto", "forex", "stocks", "commodities"]);

export const assetsTable = pgTable("assets", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull().unique(),
  name: text("name").notNull(),
  category: assetCategoryEnum("category").notNull(),
  basePrice: numeric("base_price", { precision: 18, scale: 8 }).notNull(),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAssetSchema = createInsertSchema(assetsTable).omit({ id: true, createdAt: true });
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Asset = typeof assetsTable.$inferSelect;
