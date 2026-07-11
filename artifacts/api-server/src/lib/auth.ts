import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const rawJwtSecret = process.env.JWT_SECRET || process.env.SESSION_SECRET;

if (!rawJwtSecret) {
  throw new Error("JWT_SECRET must be set to sign authentication tokens.");
}

const JWT_SECRET: string = rawJwtSecret;

export const CUSTOMER_COOKIE = "customer_token";
export const ADMIN_COOKIE = "admin_token";

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: "/",
};

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function signCustomerToken(userId: number): string {
  return jwt.sign({ sub: userId, role: "customer" }, JWT_SECRET, {
    expiresIn: "30d",
  });
}

export function signAdminToken(adminId: number): string {
  return jwt.sign({ sub: adminId, role: "admin" }, JWT_SECRET, {
    expiresIn: "30d",
  });
}

export function verifyToken(
  token: string,
): { sub: number; role: "customer" | "admin" } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as unknown as {
      sub: number;
      role: "customer" | "admin";
    };
  } catch {
    return null;
  }
}

export function setAuthCookie(
  res: import("express").Response,
  name: string,
  token: string,
) {
  res.cookie(name, token, COOKIE_OPTIONS);
}

export function clearAuthCookie(
  res: import("express").Response,
  name: string,
) {
  res.clearCookie(name, { path: "/" });
}

export function generateVerificationToken(): string {
  return (
    Math.random().toString(36).slice(2) + Date.now().toString(36) +
    Math.random().toString(36).slice(2)
  );
}
