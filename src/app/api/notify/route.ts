import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/firebaseAdmin";

/**
 * POST /api/notify
 * Sends an FCM push notification to a user by their UID.
 * Body: { recipientUid: string, messagePreview?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { recipientUid, messagePreview } = await req.json();

    if (!recipientUid) {
      return NextResponse.json({ error: "Missing recipientUid" }, { status: 400 });
    }

    // Look up the user's FCM token
    const userDoc = await adminDb.collection("users").doc(recipientUid).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const fcmToken = userDoc.data()?.fcmToken;

    if (!fcmToken) {
      // User hasn't enabled push notifications — that's fine
      return NextResponse.json({ ok: true, skipped: true, reason: "no_token" });
    }

    // Send the push notification
    await adminMessaging.send({
      token: fcmToken,
      notification: {
        title: "New message on Inkognito 👀",
        body: messagePreview
          ? `"${messagePreview.slice(0, 80)}${messagePreview.length > 80 ? "..." : ""}"`
          : "Someone sent you a message",
      },
      webpush: {
        fcmOptions: {
          link: "/dashboard",
        },
        notification: {
          icon: "/favicon.png",
          badge: "/favicon.png",
          tag: "inkognito-message",
          renotify: true,
        },
      },
      data: {
        click_action: "/dashboard",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    // If the token is invalid/expired, clean it up
    const err = error as { code?: string };
    if (
      err.code === "messaging/invalid-registration-token" ||
      err.code === "messaging/registration-token-not-registered"
    ) {
      // Token is stale — remove it
      try {
        const { recipientUid } = await req.clone().json();
        if (recipientUid) {
          await adminDb.collection("users").doc(recipientUid).update({
            fcmToken: null,
          });
        }
      } catch {
        // cleanup is best-effort
      }
      return NextResponse.json({ ok: true, skipped: true, reason: "stale_token" });
    }

    console.error("[Notify] FCM send failed:", error);
    return NextResponse.json({ error: "Notification failed" }, { status: 500 });
  }
}
