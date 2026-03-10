import { type MfaChallenge, type SessionUser, verifyPassword } from "@/lib/auth";
import {
  buildOtpAuthUrl,
  createTotpSecret,
  decryptMfaSecret,
  encryptMfaSecret,
  verifyTotpCode,
} from "@/lib/mfa";
import {
  enableUserMfa,
  findUserByEmail,
  findUserById,
  touchUserLastLogin,
} from "@/server/repositories/auth.repository";
import { type LoginInput, loginSchema, mfaCodeSchema } from "@/server/schemas/auth";

function isAdminRole(role: SessionUser["role"]): role is "super_admin" | "admin" {
  return role === "admin" || role === "super_admin";
}

type BeginAuthResult =
  | { status: "invalid_credentials" }
  | { status: "authenticated"; session: SessionUser }
  | { status: "mfa_required"; challenge: MfaChallenge }
  | {
      status: "mfa_setup_required";
      challenge: MfaChallenge;
      setupSecret: string;
      setupUri: string;
    };

export async function beginAuthentication(input: LoginInput): Promise<BeginAuthResult> {
  const credentials = loginSchema.parse(input);
  const user = await findUserByEmail(credentials.email);

  if (!user || !user.passwordHash) {
    return { status: "invalid_credentials" };
  }

  const passwordMatches = await verifyPassword(credentials.password, user.passwordHash);
  if (!passwordMatches) {
    return { status: "invalid_credentials" };
  }

  if (!isAdminRole(user.role)) {
    const session: SessionUser = {
      userId: user.userId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      ...(user.clientProfileId ? { clientProfileId: user.clientProfileId } : {}),
      mfaVerified: true,
    };

    await touchUserLastLogin(user.userId);

    return {
      status: "authenticated",
      session,
    };
  }

  if (!user.mfaEnabled || !user.mfaSecretEncrypted) {
    const setupSecret = createTotpSecret();
    const challenge: MfaChallenge = {
      userId: user.userId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      ...(user.clientProfileId ? { clientProfileId: user.clientProfileId } : {}),
      purpose: "setup",
      setupSecret,
    };

    return {
      status: "mfa_setup_required",
      challenge,
      setupSecret,
      setupUri: buildOtpAuthUrl(user.email, setupSecret),
    };
  }

  return {
    status: "mfa_required",
    challenge: {
      userId: user.userId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      ...(user.clientProfileId ? { clientProfileId: user.clientProfileId } : {}),
      purpose: "verify",
    },
  };
}

export async function completeAdminMfa(
  challenge: MfaChallenge,
  input: { code: string },
): Promise<SessionUser | null> {
  const { code } = mfaCodeSchema.parse(input);

  if (!isAdminRole(challenge.role)) {
    return null;
  }

  const user = await findUserById(challenge.userId);
  if (!user || !isAdminRole(user.role)) {
    return null;
  }

  if (user.email !== challenge.email) {
    return null;
  }

  if (challenge.purpose === "setup") {
    if (!challenge.setupSecret || !verifyTotpCode(challenge.setupSecret, code)) {
      return null;
    }

    await enableUserMfa(user.userId, encryptMfaSecret(challenge.setupSecret));
  } else {
    if (!user.mfaEnabled || !user.mfaSecretEncrypted) {
      return null;
    }

    const secret = decryptMfaSecret(user.mfaSecretEncrypted);
    if (!verifyTotpCode(secret, code)) {
      return null;
    }
  }

  await touchUserLastLogin(user.userId);

  return {
    userId: user.userId,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    ...(user.clientProfileId ? { clientProfileId: user.clientProfileId } : {}),
    mfaVerified: true,
  };
}
