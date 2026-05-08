import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import {
  welcomeEmail,
  newMessageEmail,
  loginAlertEmail,
  accountDeletedEmail,
  adminNewUserEmail,
  adminNewMessageEmail,
} from "@/lib/emailTemplates";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

type EmailType =
  | "welcome"
  | "new_message"
  | "login_alert"
  | "account_deleted"
  | "admin_new_user"
  | "admin_new_message";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, to, data } = body as {
      type: EmailType;
      to: string;
      data: Record<string, string>;
    };

    if (!type || !to) {
      return NextResponse.json({ error: "Missing type or to" }, { status: 400 });
    }

    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
      console.warn("[Email] SMTP not configured, skipping email");
      return NextResponse.json({ ok: true, skipped: true });
    }

    let email: { subject: string; html: string };

    switch (type) {
      case "welcome":
        email = welcomeEmail(data.displayName, data.username);
        break;
      case "new_message":
        email = newMessageEmail(data.displayName, data.username, data.messagePreview);
        break;
      case "login_alert":
        email = loginAlertEmail(data.displayName);
        break;
      case "account_deleted":
        email = accountDeletedEmail(data.displayName);
        break;
      case "admin_new_user":
        email = adminNewUserEmail(data.displayName, data.email, data.username);
        break;
      case "admin_new_message":
        email = adminNewMessageEmail(data.recipientUsername, data.messagePreview);
        break;
      default:
        return NextResponse.json({ error: "Unknown email type" }, { status: 400 });
    }

    await transporter.sendMail({
      from: `"Inkognito 👻" <${process.env.SMTP_EMAIL}>`,
      to,
      subject: email.subject,
      html: email.html,
    });

    // Send admin notification for new user signups only (not messages — user privacy)
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail && type === "welcome") {
      const adminTemplate = adminNewUserEmail(data.displayName, data.email || to, data.username);

      await transporter.sendMail({
        from: `"Inkognito Admin 👻" <${process.env.SMTP_EMAIL}>`,
        to: adminEmail,
        subject: adminTemplate.subject,
        html: adminTemplate.html,
      }).catch((err: unknown) => console.error("[Email] Admin notification failed:", err));
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Email] Send failed:", error);
    return NextResponse.json({ error: "Email send failed" }, { status: 500 });
  }
}
