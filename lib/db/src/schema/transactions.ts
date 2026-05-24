import { pgTable, serial, text, numeric, timestamp, pgEnum, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const transactionTypeEnum = pgEnum("transaction_type", ["deposit", "withdrawal", "trade_buy", "trade_sell", "fee"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "completed", "failed"]);

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  type: transactionTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 18, scale: 8 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  status: transactionStatusEnum("status").notNull().default("completed"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ id: true, createdAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
