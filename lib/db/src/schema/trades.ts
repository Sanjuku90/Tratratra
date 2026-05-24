import { pgTable, serial, text, numeric, timestamp, pgEnum, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const tradeSideEnum = pgEnum("trade_side", ["buy", "sell"]);
export const orderTypeEnum = pgEnum("order_type", ["market", "limit", "stop_loss", "take_profit"]);
export const tradeStatusEnum = pgEnum("trade_status", ["pending", "open", "closed", "cancelled"]);
export const tradeModeEnum = pgEnum("trade_mode", ["real", "demo"]);

export const tradesTable = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  symbol: text("symbol").notNull(),
  assetName: text("asset_name").notNull(),
  side: tradeSideEnum("side").notNull(),
  orderType: orderTypeEnum("order_type").notNull(),
  quantity: numeric("quantity", { precision: 18, scale: 8 }).notNull(),
  price: numeric("price", { precision: 18, scale: 8 }).notNull(),
  executedPrice: numeric("executed_price", { precision: 18, scale: 8 }),
  stopLoss: numeric("stop_loss", { precision: 18, scale: 8 }),
  takeProfit: numeric("take_profit", { precision: 18, scale: 8 }),
  status: tradeStatusEnum("status").notNull().default("pending"),
  pnl: numeric("pnl", { precision: 18, scale: 8 }),
  mode: tradeModeEnum("mode").notNull().default("demo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
});

export const insertTradeSchema = createInsertSchema(tradesTable).omit({ id: true, createdAt: true });
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof tradesTable.$inferSelect;
