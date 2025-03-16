import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  plaidId: text("plaid_id"),
  name: text("name").notNull(), // not null is for making it required
  userId: text("user_id").notNull(),
});

export const accountRelations = relations(accounts, ({ many }) => ({
  transactions: many(transactions), // one account can have many transactions
}));

export const insertAccountSchema = createInsertSchema(accounts); // Schema for inserting a new account

// ? Categories schema
export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  plaidId: text("plaid_id"),
  name: text("name").notNull(), // not null is for making it required
  userId: text("user_id").notNull(),
});

export const categoryRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions), // A category can have many transactions
}));

export const insertCategoriesSchema = createInsertSchema(categories);

// ? Transactions schema
export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  amount: integer("amount").notNull(),
  payee: text("payee").notNull(),
  notes: text("notes"),
  date: timestamp("date", { mode: "date" }).notNull(),
  // Relations with categories and account
  accountId: text("account_id")
    .references(() => accounts.id, {
      onDelete: "cascade",
    })
    .notNull(),
  categoryId: text("category_id").references(() => categories.id, {
    onDelete: "set null",
  }), // optional
});

export const transactionRelations = relations(transactions, ({ one }) => ({
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
  categories: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

export const insertTransactionsSchema = createInsertSchema(transactions, {
  date: z.coerce.date(), // To avoid typescript errors with date
});

// based on the reference settings for account, if we delete an "account" we remove all the "transactions" that accounts has
// based on the reference settings for categories, if we delete a "category" that a transaction is attached ot, there is no point in removing the transaction, we just set it to null, as in un-categorized. thats why we didnt add the .notNull optional declaration

// For storing the amount on the transactions schema
// Using integers of the smallest unit of currency
// 1) we are go to use miliunits to support 3 decimals
// 2) $10.50 => 10500
// 3) cross language compatible: ('for info check when i created the schema or 7hr 10mins')
