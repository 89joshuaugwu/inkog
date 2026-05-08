import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * POST /api/notify
 * Sends FCM push notifications to ALL of a user's devices.
 * Reads fcmTokens[] array from Firestore, sends to each device,
 * and cleans up any stale/expired tokens automatically.
 * Body: { recipientUid: string, messagePreview?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { recipientUid, messagePreview } = await req.json();

    if (!recipientUid) {
      return NextResponse.json({ error: "Missing recipientUid" }, { status: 400 });
    }

    // Look up the user's FCM tokens
    const userDoc = await adminDb.collection("users").doc(recipientUid).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    // Support both old single-token format and new array format
    let tokens: string[] = [];
    if (Array.isArray(userData?.fcmTokens) && userData.fcmTokens.length > 0) {
      tokens = userData.fcmTokens;
    } else if (typeof userData?.fcmToken === "string" && userData.fcmToken) {
      // Legacy single token — migrate it
      tokens = [userData.fcmToken];
    }

    if (tokens.length === 0) {
      return NextResponse.json({ ok: true, skipped: true, reason: "no_tokens" });
    }

    // Build the notification payload
    const notificationBody = messagePreview
      ? `"${messagePreview.slice(0, 80)}${messagePreview.length > 80 ? "..." : ""}"`
      : "Someone sent you a message";

    // Send to all devices
    const results = await adminMessaging.sendEachForMulticast({
      tokens,
      notification: {
        title: "New message on Inkognito 👀",
        body: notificationBody,
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

    // Collect stale tokens to remove
    const staleTokens: string[] = [];
    results.responses.forEach((response, idx) => {
      if (response.error) {
        const code = response.error.code;
        if (
          code === "messaging/invalid-registration-token" ||
          code === "messaging/registration-token-not-registered"
        ) {
          staleTokens.push(tokens[idx]);
        }
      }
    });

    // Clean up stale tokens from Firestore
    if (staleTokens.length > 0) {
      try {
        await adminDb.collection("users").doc(recipientUid).update({
          fcmTokens: FieldValue.arrayRemove(...staleTokens),
        });
      } catch {
        // cleanup is best-effort
      }
    }

    return NextResponse.json({
      ok: true,
      sent: results.successCount,
      failed: results.failureCount,
      staleRemoved: staleTokens.length,
    });
  } catch (error: unknown) {
    console.error("[Notify] FCM send failed:", error);
    return NextResponse.json({ error: "Notification failed" }, { status: 500 });
  }
}
