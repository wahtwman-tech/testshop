import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, adminUsersTable } from "@workspace/db";
import {
  LoginAdminBody,
  LoginAdminResponse,
  GetCurrentAdminResponse,
  ChangeAdminPasswordBody,
  ChangeAdminPasswordResponse,
} from "@workspace/api-zod";
import {
  hashPassword,
  verifyPassword,
  signAdminToken,
  setAuthCookie,
  clearAuthCookie,
  ADMIN_COOKIE,
} from "../lib/auth";
import { requireAdminAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.post("/admin/login", async (req, res): Promise<void> => {
  const parsed = LoginAdminBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [admin] = await db
    .select()
    .from(adminUsersTable)
    .where(eq(adminUsersTable.username, parsed.data.username));

  if (!admin || !verifyPassword(parsed.data.password, admin.passwordHash)) {
    res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
    return;
  }

  setAuthCookie(res, ADMIN_COOKIE, signAdminToken(admin.id));
  res.json(LoginAdminResponse.parse({ id: admin.id, username: admin.username }));
});

router.post("/admin/logout", async (_req, res): Promise<void> => {
  clearAuthCookie(res, ADMIN_COOKIE);
  res.json({ message: "تم تسجيل الخروج" });
});

router.get("/admin/me", requireAdminAuth, async (req, res): Promise<void> => {
  const [admin] = await db
    .select()
    .from(adminUsersTable)
    .where(eq(adminUsersTable.id, req.adminId!));
  if (!admin) {
    res.status(401).json({ error: "غير مسجل الدخول" });
    return;
  }
  res.json(GetCurrentAdminResponse.parse({ id: admin.id, username: admin.username }));
});

router.post(
  "/admin/change-password",
  requireAdminAuth,
  async (req, res): Promise<void> => {
    const parsed = ChangeAdminPasswordBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [admin] = await db
      .select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.id, req.adminId!));
    if (!admin || !verifyPassword(parsed.data.currentPassword, admin.passwordHash)) {
      res.status(400).json({ error: "كلمة المرور الحالية غير صحيحة" });
      return;
    }

    await db
      .update(adminUsersTable)
      .set({ passwordHash: hashPassword(parsed.data.newPassword) })
      .where(eq(adminUsersTable.id, admin.id));

    res.json(ChangeAdminPasswordResponse.parse({ message: "تم تغيير كلمة المرور" }));
  },
);

export default router;
