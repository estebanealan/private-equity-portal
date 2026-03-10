import { isAllowedRole, type SessionUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";

function isAdminRole(role: SessionUser["role"]) {
  return role === "admin" || role === "super_admin";
}

export function requireApiRoles(
  session: SessionUser | null,
  roles: ("super_admin" | "admin" | "client")[],
): SessionUser {
  if (!session || !isAllowedRole(session, roles)) {
    throw new AppError("Unauthorized", "UNAUTHORIZED", 401);
  }

  if (isAdminRole(session.role) && !session.mfaVerified) {
    throw new AppError("MFA verification required", "FORBIDDEN", 403);
  }

  return session;
}
