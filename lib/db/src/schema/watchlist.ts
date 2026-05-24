import { pgTable, serial, text, timestamp, integer, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const watchlistTable = pgTable("watchlist", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  symbol: text("symbol").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [unique().on(t.userId, t.symbol)]);

export const insertWatchlistSchema = createInsertSchema(watchlistTable).omit({ id: true, createdAt: true });
export type InsertWatchlist = z.infer<typeof insertWatchlistSchema>;
export type Watchlist = typeof watchlistTable.$inferSelect;
