import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { prisma } from "../../config/prisma";
import { signAccessToken } from "../../utils/jwt";
import { HttpError } from "../../utils/http-error";
import type { SignupInput, LoginInput } from "./auth.schemas";

const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Fields safe to return to callers — passwordHash is never included.
const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  provider: true,
  createdAt: true,
} as const;

// Lazily computed dummy hash used in login to keep timing consistent when the
// email does not exist. Shared across concurrent requests via the Promise.
let _dummyHashPromise: Promise<string> | null = null;
function getDummyHash(): Promise<string> {
  if (!_dummyHashPromise) {
    _dummyHashPromise = bcrypt.hash("timing_attack_prevention_dummy", BCRYPT_ROUNDS);
  }
  return _dummyHashPromise;
}

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/** Creates a new RefreshToken row and returns a signed access token + raw refresh token. */
async function issueTokenPair(userId: string) {
  const rawToken = crypto.randomBytes(48).toString("hex");

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });

  return { accessToken: signAccessToken(userId), refreshToken: rawToken };
}

/** Creates a new user and issues an initial token pair. */
export async function signup(input: SignupInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new HttpError(409, "Email already in use");
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash, provider: "EMAIL" },
    select: safeUserSelect,
  });

  const tokens = await issueTokenPair(user.id);
  return { user, ...tokens };
}

/** Verifies credentials and issues a token pair.
 *  Always returns a generic error to prevent revealing whether an email is registered. */
export async function login(input: LoginInput) {
  const userRow = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, passwordHash: true },
  });

  // Always run bcrypt.compare (even with a dummy hash) to prevent timing attacks
  const hash = userRow?.passwordHash ?? (await getDummyHash());
  const valid = await bcrypt.compare(input.password, hash);

  if (!userRow || !valid || !userRow.passwordHash) {
    throw new HttpError(401, "Invalid credentials");
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userRow.id },
    select: safeUserSelect,
  });

  const tokens = await issueTokenPair(userRow.id);
  return { user, ...tokens };
}

/** Rotates the refresh token. On reuse detection, revokes all sessions for the user. */
export async function refreshTokens(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!record) {
    throw new HttpError(401, "Invalid session");
  }

  if (record.revokedAt !== null) {
    // A rotated token was replayed — likely a stolen token. Revoke all sessions
    // for this user so any attacker copy is also invalidated.
    await prisma.refreshToken.updateMany({
      where: { userId: record.userId },
      data: { revokedAt: new Date() },
    });
    throw new HttpError(401, "Session invalidated. Please log in again.");
  }

  if (record.expiresAt < new Date()) {
    throw new HttpError(401, "Session expired");
  }

  // Rotate: mark old token revoked, issue a fresh pair
  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });

  return issueTokenPair(record.userId);
}

/** Revokes the refresh token for the given raw token. Idempotent — safe to call twice. */
export async function logout(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** Returns the safe user shape for the given userId. */
export async function getMe(userId: string) {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: safeUserSelect,
  });
}
