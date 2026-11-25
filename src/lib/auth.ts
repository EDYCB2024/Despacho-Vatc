import crypto from "crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "vatc_despacho_session";

export interface SessionUser {
  id: string;
  email: string;
  full_name: string;
  alias: string | null;
  role: string;
  department: string;
}

function getSecret(): string {
  return process.env.AUTH_SECRET || "despacho-vatc-emerald-green-secret-2026";
}

export function signSession(user: SessionUser): string {
  const payload = Buffer.from(
    JSON.stringify({
      ...user,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
    })
  ).toString("base64url");

  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");

  return `${payload}.${sig}`;
}

export function verifySession(token: string | undefined | null): SessionUser | null {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;

  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");

  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!parsed.exp || Date.now() > parsed.exp) return null;
    return {
      id: parsed.id,
      email: parsed.email,
      full_name: parsed.full_name,
      alias: parsed.alias || null,
      role: parsed.role || "viewer",
      department: parsed.department || "DESPACHO",
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySession(token);
}
