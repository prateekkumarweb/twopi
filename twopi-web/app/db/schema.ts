import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { v4 as uuidv4 } from "uuid";

export const currencyTable = sqliteTable("currency", {
  code: text().primaryKey(),
  name: text().notNull(),
  base: integer().notNull(),
});

export const accountTable = sqliteTable("account", {
  id: text()
    .primaryKey()
    .$default(() => uuidv4()),
  name: text().notNull(),
  accountType: text("account_type").notNull(),
  currency: text()
    .notNull()
    .references(() => currencyTable.code),
  startingBalance: integer("starting_balance").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`datetime('now')`),
  accountExtra: text("account_extra", { mode: "json" }),
});

export const categoryTable = sqliteTable("category", {
  name: text().primaryKey(),
  group: text(),
});

export const transactionTable = sqliteTable("transaction", {
  id: text()
    .primaryKey()
    .$default(() => uuidv4()),
  categoryTable: text("category").references(() => categoryTable.name, {
    onDelete: "set null",
  }),
  timestamp: integer()
    .notNull()
    .default(sql`datetime('now')`),
});

export const trannsactionItemTable = sqliteTable("transaction_item", {
  id: text()
    .primaryKey()
    .$default(() => uuidv4()),
  transaction: text()
    .notNull()
    .references(() => transactionTable.id),
  account: text()
    .notNull()
    .references(() => accountTable.id),
  amount: integer().notNull().default(0),
  currency: text()
    .notNull()
    .references(() => currencyTable.code),
  currencyAmount: integer("currency_amount").notNull().default(0),
});
