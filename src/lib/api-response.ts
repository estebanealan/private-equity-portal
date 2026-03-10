import { randomUUID } from "node:crypto";

export function apiSuccess<T>(data: T, meta?: Record<string, unknown>) {
  return Response.json({
    success: true,
    data,
    meta: {
      ...meta,
      requestId: randomUUID(),
      timestamp: new Date().toISOString(),
    },
  });
}

export function apiError(
  code: string,
  message: string,
  status: number,
  details?: Record<string, string[]>,
) {
  return Response.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
      meta: {
        requestId: randomUUID(),
        timestamp: new Date().toISOString(),
      },
    },
    { status },
  );
}
