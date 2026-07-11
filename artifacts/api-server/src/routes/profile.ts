import { Router, type IRouter } from "express";
import { eq, and, ne } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  UpdateProfileBody,
  ChangeCustomerPasswordBody,
  UpdateProfileResponse,
  ChangeCustomerPasswordResponse,
} from "@workspace/api-zod";
import { requireCustomerAuth } from "../middlewares/auth";
import { hashPassword, verifyPassword, generateVerificationToken } from "../lib/auth";
import { sendVerificationEmail } from "../lib/email";
import { toApiUser } from "./auth";

const router: IRouter = Router();

router.patch(
  "/profile",
  requireCustomerAuth,
  async (req, res): Promise<void> => {
    const parsed = UpdateProfileBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [current] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.customerId!));
    if (!current) {
      res.status(401).json({ error: "غير مسجل الدخول" });
      return;
    }

    const updates: Partial<typeof usersTable.$inferInsert> = {};
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone;

    if (parsed.data.email !== undefined && parsed.data.email !== current.email) {
      const [existing] = await db
        .select()
        .from(usersTable)
        .where(
          and(eq(usersTable.email, parsed.data.email), ne(usersTable.id, current.id)),
        );
      if (existing) {
        res.status(409).json({ error: "هذا البريد الإلكتروني مستخدم بالفعل" });
        return;
      }
      const verificationToken = generateVerificationToken();
      updates.email = parsed.data.email;
      updates.emailVerified = false;
      updates.verificationToken = verificationToken;
      updates.verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const verifyUrl = `${req.protocol}://${req.get("host")}/verify-email?token=${verificationToken}`;
      await sendVerificationEmail(parsed.data.email, current.name, verifyUrl);
    }

    const [updated] = await db
      .update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, current.id))
      .returning();

    res.json(UpdateProfileResponse.parse(toApiUser(updated)));
  },
);

router.post(
  "/profile/password",
  requireCustomerAuth,
  async (req, res): Promise<void> => {
    const parsed = ChangeCustomerPasswordBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.customerId!));
    if (!user || !verifyPassword(parsed.data.currentPassword, user.passwordHash)) {
      res.status(400).json({ error: "كلمة المرور الحالية غير صحيحة" });
      return;
    }

    await db
      .update(usersTable)
      .set({ passwordHash: hashPassword(parsed.data.newPassword) })
      .where(eq(usersTable.id, user.id));

    res.json(ChangeCustomerPasswordResponse.parse({ message: "تم تغيير كلمة المرور" }));
  },
);

export default router;
