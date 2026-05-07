/**
 * Branded Inkognito email templates.
 * All emails use a consistent dark premium design matching the app aesthetic.
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://inkog.vercel.app";

const baseStyles = `
  body { margin: 0; padding: 0; background-color: #0A0A0A; font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; }
  .container { max-width: 600px; margin: 0 auto; background-color: #0A0A0A; }
  .header { text-align: center; padding: 40px 30px 20px; }
  .logo-text { color: #FFFFFF; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
  .logo-accent { color: #8B5CF6; }
  .gradient-bar { height: 4px; background: linear-gradient(90deg, #7C3AED, #06B6D4); }
  .content { padding: 32px 30px; }
  .card { background-color: #141414; border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 16px; padding: 28px; margin: 20px 0; }
  .title { color: #FFFFFF; font-size: 24px; font-weight: 700; margin: 0 0 8px; letter-spacing: -0.5px; }
  .subtitle { color: #6B7280; font-size: 14px; margin: 0 0 20px; line-height: 1.5; }
  .message-text { color: #FFFFFF; font-size: 16px; font-weight: 500; line-height: 1.6; margin: 0; }
  .label { color: #A78BFA; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; margin: 0 0 8px; }
  .btn { display: inline-block; background-color: #8B5CF6; color: #FFFFFF !important; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 28px; }
  .btn-outline { display: inline-block; border: 2px solid rgba(139, 92, 246, 0.4); color: #A78BFA !important; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 28px; }
  .footer { text-align: center; padding: 24px 30px 40px; }
  .footer-text { color: #6B7280; font-size: 12px; margin: 4px 0; }
  .divider { height: 1px; background-color: rgba(139, 92, 246, 0.1); margin: 20px 0; }
  .ghost { font-size: 48px; }
  .stats-grid { display: flex; gap: 12px; margin: 16px 0; }
  .stat-box { flex: 1; background-color: #0A0A0A; border-radius: 12px; padding: 16px; text-align: center; }
  .stat-number { color: #FFFFFF; font-size: 24px; font-weight: 700; margin: 0; }
  .stat-label { color: #6B7280; font-size: 11px; margin: 4px 0 0; text-transform: uppercase; }
`;

function wrapEmail(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inkognito</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="gradient-bar"></div>
    <div class="header">
      <span class="logo-text">Ink<span class="logo-accent">o</span>gnito</span>
    </div>
    ${content}
    <div class="gradient-bar"></div>
    <div class="footer">
      <p class="footer-text">Inkognito — Say it. Anonymously. 👻</p>
      <p class="footer-text">Nigeria's boldest anonymous messaging platform</p>
      <p class="footer-text" style="margin-top: 12px;">
        <a href="${BASE_URL}" style="color: #A78BFA; text-decoration: none;">inkog.vercel.app</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ==========================================
// USER EMAILS
// ==========================================

export function welcomeEmail(displayName: string, username: string): { subject: string; html: string } {
  return {
    subject: "Welcome to Inkognito! 👻",
    html: wrapEmail(`
      <div class="content">
        <p class="ghost" style="text-align: center; margin: 0 0 16px;">👻</p>
        <h1 class="title" style="text-align: center;">Welcome, ${displayName}!</h1>
        <p class="subtitle" style="text-align: center;">Your anonymous messaging journey starts now. You're officially on the grid — incognito style.</p>
        
        <div class="card">
          <p class="label">YOUR INKOGNITO LINK</p>
          <p style="color: #FFFFFF; font-size: 18px; font-weight: 700; margin: 0;">
            <a href="${BASE_URL}/u/${username}" style="color: #A78BFA; text-decoration: none;">inkog.vercel.app/u/${username}</a>
          </p>
          <p style="color: #6B7280; font-size: 13px; margin: 8px 0 0;">Share this link anywhere to start receiving messages</p>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${BASE_URL}/dashboard" class="btn">Go to Dashboard →</a>
        </div>

        <div class="divider"></div>
        
        <p class="subtitle" style="text-align: center; margin: 16px 0 0;">Share your link on WhatsApp, Instagram, Twitter — wherever your people are. Let the truth flow. 🔥</p>
      </div>
    `),
  };
}

export function newMessageEmail(displayName: string, username: string, messagePreview: string): { subject: string; html: string } {
  // Truncate message for email preview
  const preview = messagePreview.length > 100 ? messagePreview.slice(0, 100) + "..." : messagePreview;
  
  return {
    subject: "You got a new anonymous message! 👀",
    html: wrapEmail(`
      <div class="content">
        <h1 class="title">New message, ${displayName}!</h1>
        <p class="subtitle">Someone just sent you an anonymous message on Inkognito.</p>
        
        <div class="card">
          <p class="label">ANONYMOUS MESSAGE</p>
          <p class="message-text">"${preview}"</p>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${BASE_URL}/dashboard" class="btn">View Message →</a>
        </div>

        <p class="subtitle" style="text-align: center; font-size: 12px;">You can react, share, or delete this message from your dashboard.</p>
      </div>
    `),
  };
}

export function loginAlertEmail(displayName: string): { subject: string; html: string } {
  const now = new Date().toLocaleString("en-NG", { dateStyle: "full", timeStyle: "short" });
  
  return {
    subject: "New login to your Inkognito account",
    html: wrapEmail(`
      <div class="content">
        <h1 class="title">Hey ${displayName},</h1>
        <p class="subtitle">We noticed a new sign-in to your Inkognito account.</p>
        
        <div class="card">
          <p class="label">LOGIN DETAILS</p>
          <p style="color: #FFFFFF; font-size: 14px; margin: 0 0 4px;"><strong>Time:</strong> ${now}</p>
          <p style="color: #6B7280; font-size: 12px; margin: 8px 0 0;">If this was you, no action needed. If not, please secure your Google account immediately.</p>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${BASE_URL}/settings" class="btn-outline">Review Account →</a>
        </div>
      </div>
    `),
  };
}

export function accountDeletedEmail(displayName: string): { subject: string; html: string } {
  return {
    subject: "Your Inkognito account has been deleted",
    html: wrapEmail(`
      <div class="content">
        <p class="ghost" style="text-align: center; margin: 0 0 16px;">👋</p>
        <h1 class="title" style="text-align: center;">Goodbye, ${displayName}</h1>
        <p class="subtitle" style="text-align: center;">Your Inkognito account and all associated data have been permanently deleted.</p>
        
        <div class="card">
          <p style="color: #6B7280; font-size: 14px; margin: 0; line-height: 1.6;">
            All your messages, profile data, and username reservation have been removed. If you ever want to come back, you're always welcome to create a new account.
          </p>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${BASE_URL}" class="btn-outline">Visit Inkognito →</a>
        </div>
      </div>
    `),
  };
}

// ==========================================
// ADMIN EMAILS
// ==========================================

export function adminNewUserEmail(displayName: string, email: string, username: string): { subject: string; html: string } {
  return {
    subject: `[Admin] New user: @${username}`,
    html: wrapEmail(`
      <div class="content">
        <h1 class="title">New User Registration</h1>
        <p class="subtitle">A new user just completed onboarding on Inkognito.</p>
        
        <div class="card">
          <p class="label">USER DETAILS</p>
          <p style="color: #FFFFFF; font-size: 14px; margin: 0 0 4px;"><strong>Name:</strong> ${displayName}</p>
          <p style="color: #FFFFFF; font-size: 14px; margin: 0 0 4px;"><strong>Email:</strong> ${email}</p>
          <p style="color: #FFFFFF; font-size: 14px; margin: 0 0 4px;"><strong>Username:</strong> @${username}</p>
          <p style="color: #FFFFFF; font-size: 14px; margin: 0;"><strong>Profile:</strong> <a href="${BASE_URL}/u/${username}" style="color: #A78BFA;">View Profile →</a></p>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${BASE_URL}/admin" class="btn">Admin Dashboard →</a>
        </div>
      </div>
    `),
  };
}

export function adminNewMessageEmail(recipientUsername: string, messagePreview: string): { subject: string; html: string } {
  const preview = messagePreview.length > 150 ? messagePreview.slice(0, 150) + "..." : messagePreview;
  
  return {
    subject: `[Admin] New message to @${recipientUsername}`,
    html: wrapEmail(`
      <div class="content">
        <h1 class="title">New Message Sent</h1>
        <p class="subtitle">An anonymous message was just sent on Inkognito.</p>
        
        <div class="card">
          <p class="label">MESSAGE DETAILS</p>
          <p style="color: #FFFFFF; font-size: 14px; margin: 0 0 8px;"><strong>To:</strong> @${recipientUsername}</p>
          <p class="label" style="margin-top: 12px;">CONTENT</p>
          <p class="message-text">"${preview}"</p>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${BASE_URL}/admin" class="btn-outline">View in Admin →</a>
        </div>
      </div>
    `),
  };
}
