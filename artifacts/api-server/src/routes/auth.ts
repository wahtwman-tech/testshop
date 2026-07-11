import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  RegisterCustomerBody,
  VerifyEmailBody,
  LoginCustomerBody,
  RegisterCustomerResponse,
  VerifyEmailResponse,
  LoginCustomerResponse,
  GetCurrentCustomerResponse,
} from "@workspace/api-zod";
import {
  hashPassword,
  verifyPassword,
  signCustomerToken,
  setAuthCookie,
  clearAuthCookie,
  generateVerificationToken,
  CUSTOMER_COOKIE,
} from "../lib/auth";
import { sendVerificationEmail } from "../lib/email";
import { requireCustomerAuth } from "../middlewares/auth";

const router: IRouter = Router();

function toApiUser(row: typeof usersTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    emailVerified: row.emailVerified,
    createdAt: row.createdAt.toISOString(),
  };
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, email, phone, password } = parsed.data;

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));
  if (existing) {
    res.status(409).json({ error: "هذا البريد الإلكتروني مسجل بالفعل" });
    return;
  }

  const verificationToken = generateVerificationToken();
  const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.insert(usersTable).values({
    name,
    email,
    phone,
    passwordHash: hashPassword(password),
    emailVerified: false,
    verificationToken,
    verificationTokenExpiresAt,
  });

  const verifyUrl = `${req.protocol}://${req.get("host")}/verify-email?token=${verificationToken}`;
  await sendVerificationEmail(email, name, verifyUrl);

  res
    .status(201)
    .json(
      RegisterCustomerResponse.parse({
        message: "تم إنشاء الحساب، الرجاء تفعيله عبر الرابط المرسل إلى بريدك الإلكتروني",
      }),
    );
});

router.post("/auth/verify-email", async (req, res): Promise<void> => {
  const parsed = VerifyEmailBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.verificationToken, parsed.data.token));

  if (
    !user ||
    !user.verificationTokenExpiresAt ||
    user.verificationTokenExpiresAt.getTime() < Date.now()
  ) {
    res.status(400).json({ error: "الرابط غير صالح أو منتهي الصلاحية" });
    return;
  }

  await db
    .update(usersTable)
    .set({
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpiresAt: null,
    })
    .where(eq(usersTable.id, user.id));

  res.json(VerifyEmailResponse.parse({ message: "تم تفعيل حسابك بنجاح" }));
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, parsed.data.email));

  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
    return;
  }

  setAuthCookie(res, CUSTOMER_COOKIE, signCustomerToken(user.id));
  res.json(LoginCustomerResponse.parse(toApiUser(user)));
});

router.post("/auth/logout", async (_req, res): Promise<void> => {
  clearAuthCookie(res, CUSTOMER_COOKIE);
  res.json({ message: "تم تسجيل الخروج" });
});

router.get(
  "/auth/me",
  requireCustomerAuth,
  async (req, res): Promise<void> => {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.customerId!));

    if (!user) {
      res.status(401).json({ error: "غير مسجل الدخول" });
      return;
    }

    res.json(GetCurrentCustomerResponse.parse(toApiUser(user)));
  },
);

export default router;
export { toApiUser };
