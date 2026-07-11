import { logger } from "./logger";

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL;
const SENDER_NAME = process.env.BREVO_SENDER_NAME ?? "المتجر";

export async function sendVerificationEmail(
  toEmail: string,
  toName: string,
  verifyUrl: string,
): Promise<void> {
  if (!BREVO_API_KEY || !SENDER_EMAIL) {
    logger.error(
      "BREVO_API_KEY or BREVO_SENDER_EMAIL is not configured; skipping verification email.",
    );
    return;
  }

  const html = `
    <div dir="rtl" style="font-family: sans-serif; text-align: right;">
      <h2>مرحباً ${toName}</h2>
      <p>شكراً لتسجيلك. الرجاء تفعيل حسابك بالضغط على الرابط التالي:</p>
      <p><a href="${verifyUrl}" style="background:#166534;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">تفعيل الحساب</a></p>
      <p>أو انسخ هذا الرابط في متصفحك:</p>
      <p>${verifyUrl}</p>
    </div>
  `;

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "api-key": BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: toEmail, name: toName }],
      subject: "تفعيل حسابك",
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    logger.error({ status: response.status, text }, "Failed to send verification email");
  }
}
