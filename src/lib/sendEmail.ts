/**
 * Client-side helper to send emails via the /api/email route.
 * Fire-and-forget — never blocks the UI.
 */
export function sendEmail(
  type: string,
  to: string,
  data: Record<string, string>
) {
  fetch("/api/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, to, data }),
  }).catch((err) => console.warn("[Email] Failed to send:", err));
}
