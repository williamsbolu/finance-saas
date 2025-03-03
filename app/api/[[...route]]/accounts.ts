import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "@/db/drizzle";
import { accounts } from "@/db/schema";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
// import { HTTPException } from "hono/http-exception";

const app = new Hono().get("/", clerkMiddleware(), async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json({ error: "Unauthorized" }, 401); // not a valid way to handle this

    // This version helps handles type safety when throwing errors on the older version before this.. but is not needed on the newer one i'm using
    // throw new HTTPException(401, {
    //   res: c.json({ error: "Unauthorized" }, 401),
    // });
  }

  const data = await db
    .select({ id: accounts.id, name: accounts.name })
    .from(accounts)
    .where(eq(accounts.userId, auth.userId));

  return c.json({ data });
});

export default app;
