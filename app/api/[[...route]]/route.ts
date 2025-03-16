import { Hono } from "hono";
import { handle } from "hono/vercel";
// import { HTTPException } from "hono/http-exception";

import accounts from "./accounts";
import categories from "./categories";
import transactions from "./transactions";

export const runtime = "edge";

const app = new Hono().basePath("/api");

const routes = app
  .route("/accounts", accounts)
  .route("/categories", categories)
  .route("/transactions", transactions);

// app.onError((err, c) => { // we use this only if we're throwing HTTPException error like we did on the accounts routes
// 2 hour: 35mins
//   if (err instanceof HTTPException) {
//     return err.getResponse(); // because we signed the response where we threw the HTTPException error
//   }

//   return c.json({ error: "Internal error" }, 500);
// });

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);

export type AppType = typeof routes;
