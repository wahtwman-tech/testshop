import type { Request, Response, NextFunction } from "express";
import { CUSTOMER_COOKIE, ADMIN_COOKIE, verifyToken } from "../lib/auth";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      customerId?: number;
      adminId?: number;
    }
  }
}

export function requireCustomerAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token = req.cookies?.[CUSTOMER_COOKIE];
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "customer") {
    res.status(401).json({ error: "غير مسجل الدخول" });
    return;
  }
  req.customerId = payload.sub;
  next();
}

export function requireAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token = req.cookies?.[ADMIN_COOKIE];
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "admin") {
    res.status(401).json({ error: "غير مسجل الدخول" });
    return;
  }
  req.adminId = payload.sub;
  next();
}
