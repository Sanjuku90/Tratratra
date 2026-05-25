import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const tradesTable = sqliteTable("trades", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  symbol: text("symbol").notNull(),
  assetName: text("asset_name").notNull(),
  side: text("side", { enum: ["buy", "sell"] }).notNull(),
  orderType: text("order_type", { enum: ["market", "limit", "stop_loss", "take_profit"] }).notNull(),
  quantity: text("quantity").notNull(),
  price: text("price").notNull(),
  executedPrice: text("executed_price"),
  stopLoss: text("stop_loss"),
  takeProfit: text("take_profit"),
  status: text("status", { enum: ["pending", "open", "closed", "cancelled"] }).notNull().default("pending"),
  pnl: text("pnl"),
  mode: text("mode", { enum: ["real", "demo"] }).notNull().default("demo"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  closedAt: integer("closed_at", { mode: "timestamp" }),
});

export const insertTradeSchema = createInsertSchema(tradesTable).omit({ id: true, createdAt: true });
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof tradesTable.$inferSelect;
