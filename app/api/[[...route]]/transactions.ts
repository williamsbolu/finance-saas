import { z } from "zod";
import { parse, subDays } from "date-fns";
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { Hono } from "hono";
import { createId } from "@paralleldrive/cuid2"; // 2hr: 49mins
import { zValidator } from "@hono/zod-validator";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { db } from "@/db/drizzle";
import {
  transactions,
  insertTransactionsSchema,
  categories,
  accounts,
} from "@/db/schema";

const app = new Hono()
  .get(
    "/",
    zValidator(
      "query",
      z.object({
        from: z.string().optional(),
        to: z.string().optional(),
        accountId: z.string().optional(),
      })
    ),
    clerkMiddleware(),
    async (c) => {
      const auth = getAuth(c);
      const { from, to, accountId } = c.req.valid("query");

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const defaultTo = new Date();
      const defaultFrom = subDays(defaultTo, 30); // 30 days from today

      const startDate = from
        ? parse(from, "yyy-MM-dd", new Date())
        : defaultFrom;

      const endDate = to ? parse(to, "yyy-MM-dd", new Date()) : defaultTo;

      const data = await db
        .select({
          id: transactions.id, // 5hr 52mins
          date: transactions.date,
          category: categories.name, // new field 😊
          categoryId: transactions.categoryId,
          payee: transactions.payee,
          amount: transactions.amount,
          notes: transactions.notes,
          account: accounts.name, // new field 😊
          accountId: transactions.accountId,
        })
        .from(transactions)
        .innerJoin(accounts, eq(transactions.accountId, accounts.id)) // Ensures that every transaction has a matching accountId, every transaction should have a valid account if not it would be ignored.
        .leftJoin(categories, eq(transactions.categoryId, categories.id)) // Match each transaction with its category if it has one, but keep the transaction even if there’s no match.”
        .where(
          and(
            accountId ? eq(transactions.accountId, accountId) : undefined, // if we have an accountId, we want to load transactions with that accountId otherwise skip it "undefined"
            eq(accounts.userId, auth.userId), // Ensures only the users transactions are being loaded. and its possible because of the "innerjoin" i added that joined the account table
            gte(transactions.date, startDate),
            lte(transactions.date, endDate)
          )
        )
        .orderBy(desc(transactions.date));

      return c.json({ data });
    }
  )
  .get(
    "/:id",
    zValidator("param", z.object({ id: z.string().optional() })),
    clerkMiddleware(),
    async (c) => {
      const auth = getAuth(c);
      const { id } = c.req.valid("param");

      if (!id) {
        return c.json({ error: "Invalid id" }, 400);
      }

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const [data] = await db
        .select({
          id: transactions.id,
          date: transactions.date,
          categoryId: transactions.categoryId,
          payee: transactions.payee,
          amount: transactions.amount,
          notes: transactions.notes,
          accountId: transactions.accountId,
        })
        .from(transactions)
        .innerJoin(accounts, eq(transactions.accountId, accounts.id)) // Ensures that every transaction has a matching accountId, every transaction should have a valid account if not it would be ignored.
        .where(and(eq(transactions.id, id), eq(accounts.userId, auth.userId)));

      if (!data) {
        return c.json({ error: "Not found" }, 404);
      }

      return c.json({ data });
    }
  )
  .post(
    "/",
    clerkMiddleware(),
    zValidator(
      "json",
      insertTransactionsSchema.omit({
        id: true, // We want everything except the id field
      })
    ),
    async (c) => {
      const auth = getAuth(c);
      const values = c.req.valid("json");

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401); // The error code "401" is important
      }

      const [data] = await db
        .insert(transactions)
        .values({ id: createId(), ...values })
        .returning();

      return c.json({ data });
    }
  )
  .post(
    "/bulk-create",
    clerkMiddleware(),
    zValidator("json", z.array(insertTransactionsSchema.omit({ id: true }))),
    async (c) => {
      const auth = getAuth(c);
      const values = c.req.valid("json");

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401); // The error code "401" is important
      }

      const data = await db
        .insert(transactions)
        .values(
          values.map((value) => ({
            id: createId(),
            ...value,
          }))
        )
        .returning();

      return c.json({ data });
    }
  )
  .post(
    "/bulk-delete",
    clerkMiddleware(),
    zValidator("json", z.object({ ids: z.array(z.string()) })),
    async (c) => {
      const auth = getAuth(c);
      const { ids } = c.req.valid("json");

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // This CTE going to contain list of transaction IDs that meet the conditions
      // This here is a Common Table Expression (CTE) which is like a temporary mini-table you create to use later in the query: This part inside the .as(...) is figuring out which transactions to target:
      const transactionsToDelete = db.$with("transactions_to_delete").as(
        db
          .select({ id: transactions.id })
          .from(transactions)
          .innerJoin(accounts, eq(transactions.accountId, accounts.id))
          .where(
            and(inArray(transactions.id, ids), eq(accounts.userId, auth.userId))
          )
      );

      const data = await db
        .with(transactionsToDelete) // This tells Drizzle to use the CTE we just defined
        .delete(transactions)
        .where(
          inArray(
            transactions.id,
            sql`(select id from ${transactionsToDelete})`
          ) // This filters the delete operation to only touch rows in the transactions table where the id matches one of those IDs from the CTE "transactionsToDelete"
        )
        .returning({ id: transactions.id });

      return c.json({ data });
    }
  )
  .patch(
    "/:id",
    clerkMiddleware(),
    // This validator is for the param id we want to patch
    zValidator(
      "param",
      z.object({
        id: z.string().optional(),
      })
    ),
    // The validator for the actual json object
    zValidator(
      "json",
      insertTransactionsSchema.omit({
        id: true,
      })
    ),
    async (c) => {
      const auth = getAuth(c);
      const { id } = c.req.valid("param");
      const values = c.req.valid("json");

      if (!id) {
        return c.json({ error: "Missing id" }, 400);
      }

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const transactionsToUpdate = db.$with("transactions_to_update").as(
        db
          .select({ id: transactions.id })
          .from(transactions)
          .innerJoin(accounts, eq(transactions.accountId, accounts.id))
          .where(and(eq(transactions.id, id), eq(accounts.userId, auth.userId)))
      );

      const [data] = await db
        .with(transactionsToUpdate)
        .update(transactions)
        .set(values)
        .where(
          inArray(
            transactions.id,
            sql`(select id from ${transactionsToUpdate})`
          )
        )
        .returning();

      if (!data) {
        return c.json({ error: "Not found" }, 404);
      }

      return c.json({ data });
    }
  )
  .delete(
    "/:id",
    clerkMiddleware(),
    // This validator is for the param id we want to patch
    zValidator(
      "param",
      z.object({
        id: z.string().optional(),
      })
    ),
    async (c) => {
      const auth = getAuth(c);
      const { id } = c.req.valid("param");

      if (!id) {
        return c.json({ error: "Missing id" }, 400);
      }

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const transactionsToDelete = db.$with("transactions_to_delete").as(
        db
          .select({ id: transactions.id })
          .from(transactions)
          .innerJoin(accounts, eq(transactions.accountId, accounts.id))
          .where(and(eq(transactions.id, id), eq(accounts.userId, auth.userId)))
      );

      const [data] = await db
        .with(transactionsToDelete)
        .delete(transactions)
        .where(
          inArray(
            transactions.id,
            sql`(select id from ${transactionsToDelete})`
          )
        )
        .returning({ id: transactions.id });

      if (!data) {
        return c.json({ error: "Not found" }, 404);
      }

      return c.json({ data });
    }
  );

export default app;
