import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import { apiError, apiSuccess } from "@/lib/api-response";
import { clearSessionCookie, getSessionFromRequest } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { requireApiRoles } from "@/server/services/access.service";
import { listAdminMovements, registerMovement } from "@/server/services/movement.service";
import { getClientPortfolio } from "@/server/services/portfolio.service";

type AppVariables = {
  requestId: string;
  session: Awaited<ReturnType<typeof getSessionFromRequest>>;
};

const app = new Hono<{ Variables: AppVariables }>();

app.use("*", async (c, next) => {
  c.set("requestId", randomUUID());
  c.set("session", await getSessionFromRequest(c.req.raw));
  await next();
});

app.onError((error, c) => {
  logger.error({ error, requestId: c.get("requestId") }, "API request failed");

  if (error instanceof AppError) {
    return apiError(error.code, error.message, error.statusCode);
  }

  return apiError("INTERNAL_ERROR", "Unexpected server error", 500);
});

app.get("/api/v1/me", (c) => apiSuccess({ session: c.get("session") }));

app.post("/api/v1/auth/logout", async () => {
  await clearSessionCookie();
  return apiSuccess({ ok: true });
});

app.get("/api/v1/admin/movements", async (c) => {
  requireApiRoles(c.get("session"), ["admin", "super_admin"]);
  const clientProfileId = c.req.query("clientProfileId") ?? undefined;
  const items = await listAdminMovements(clientProfileId);

  return apiSuccess({ items });
});

app.post("/api/v1/admin/movements", async (c) => {
  const session = requireApiRoles(c.get("session"), ["admin", "super_admin"]);
  const body = await c.req.json();
  const movement = await registerMovement(body, session.userId);

  return apiSuccess({ movement });
});

app.get("/api/v1/client/portfolio", async (c) => {
  const session = requireApiRoles(c.get("session"), ["client", "admin", "super_admin"]);
  const requestedClientProfileId = c.req.query("clientProfileId") ?? undefined;
  const clientProfileId =
    session.role === "client"
      ? session.clientProfileId
      : (requestedClientProfileId ?? session.clientProfileId);

  if (!clientProfileId) {
    throw new AppError("Client profile is required", "VALIDATION_ERROR", 400);
  }

  const portfolio = await getClientPortfolio(clientProfileId);
  return apiSuccess(portfolio);
});

export { app };
