import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const autoSubscriptionsTable = sqliteTable("auto_subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  planId: text("plan_id", { enum: ["starter", "pro", "elite", "vip"] }).notNull(),
  planName: text("plan_name").notNull(),
  amount: text("amount").notNull(),
  riskLevel: text("risk_level", { enum: ["conservative", "moderate", "aggressive"] }).notNull().default("moderate"),
  targetAssets: text("target_assets", { enum: ["crypto", "forex", "stocks", "mixed"] }).notNull().default("mixed"),
  durationMonths: integer("duration_months").notNull().default(1),
  status: text("status", { enum: ["pending", "active", "paused", "completed", "cancelled"] }).notNull().default("pending"),
  currentProfit: text("current_profit").notNull().default("0"),
  adminNote: text("admin_note"),
  activatedAt: integer("activated_at", { mode: "timestamp" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const insertAutoSubscriptionSchema = createInsertSchema(autoSubscriptionsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAutoSubscription = z.infer<typeof insertAutoSubscriptionSchema>;
export type AutoSubscription = typeof autoSubscriptionsTable.$inferSelect;
