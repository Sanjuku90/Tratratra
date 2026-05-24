import { pgTable, text, serial, timestamp, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tradingModeEnum = pgEnum("trading_mode", ["real", "demo"]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  tradingMode: tradingModeEnum("trading_mode").notNull().default("demo"),
  realBalance: numeric("real_balance", { precision: 18, scale: 8 }).notNull().default("0"),
  demoBalance: numeric("demo_balance", { precision: 18, scale: 8 }).notNull().default("10000"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
