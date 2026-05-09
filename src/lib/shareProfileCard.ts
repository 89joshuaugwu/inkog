import { MessageTypeConfig } from "@/lib/messageTypes";

interface CardProfile {
  displayName: string;
  username: string;
  photoURL?: string;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "inkognito.vercel.app";

// ── Load image with CORS + timeout fallback ──────────────────
async function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const timer = setTimeout(() => resolve(null), 5000);
    img.onload = () => { clearTimeout(timer); resolve(img); };
    img.onerror = () => { clearTimeout(timer); resolve(null); };
    img.src = src;
  });
}

// ── Word wrap ────────────────────────────────────────────────
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? current + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ── Main generator ───────────────────────────────────────────
export async function generateProfileCard(
  profile: CardProfile,
  typeConfig: MessageTypeConfig,
  linkUrl: string
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const W = 1080;
  const H = 1080;
  canvas.width = W;
  canvas.height = H;

  // ── Extract accent RGB from typeConfig ────────────────────
  const rgbMatch = typeConfig.badgeBorder.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  const [R, G, B] = rgbMatch
    ? [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3])]
    : [139, 92, 246];
  const accent       = `rgb(${R}, ${G}, ${B})`;
  const accentAlpha  = (a: number) => `rgba(${R}, ${G}, ${B}, ${a})`;

  // ── Load assets ───────────────────────────────────────────
  const [logoImg, profileImg] = await Promise.all([
    loadImage("/logo.png"),
    profile.photoURL ? loadImage(profile.photoURL) : Promise.resolve(null),
  ]);

  // ── Background gradient ───────────────────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, "#0A0A0A");
  bgGrad.addColorStop(0.35, accentAlpha(0.14));
  bgGrad.addColorStop(0.65, "#0A0A0A");
  bgGrad.addColorStop(1, accentAlpha(0.09));
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // ── Ambient glow orb centered on profile area ─────────────
  const ambientGrad = ctx.createRadialGradient(W / 2, 380, 0, W / 2, 380, 420);
  ambientGrad.addColorStop(0, accentAlpha(0.2));
  ambientGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = ambientGrad;
  ctx.fillRect(0, 0, W, H);

  // Corner ambient glows
  const cornerGlow1 = ctx.createRadialGradient(0, 0, 0, 0, 0, 350);
  cornerGlow1.addColorStop(0, accentAlpha(0.1));
  cornerGlow1.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = cornerGlow1;
  ctx.fillRect(0, 0, W, H);

  const cornerGlow2 = ctx.createRadialGradient(W, H, 0, W, H, 350);
  cornerGlow2.addColorStop(0, "rgba(6,182,212,0.1)");
  cornerGlow2.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = cornerGlow2;
  ctx.fillRect(0, 0, W, H);

  // ── Blurred logo watermark ────────────────────────────────
  if (logoImg) {
    ctx.save();
    ctx.globalAlpha = 0.035;
    ctx.filter = "blur(24px)";
    const wmSize = 700;
    ctx.drawImage(logoImg, (W - wmSize) / 2, (H - wmSize) / 2, wmSize, wmSize);
    ctx.filter = "none";
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ── Static decorative dots ────────────────────────────────
  const dots = [
    [90, 120, 3], [990, 160, 2], [140, 920, 2.5], [940, 880, 3],
    [540, 60, 2], [60, 540, 2], [1020, 540, 2], [300, 980, 2],
    [780, 960, 2.5], [200, 300, 1.5], [860, 280, 1.5],
  ];
  ctx.fillStyle = accentAlpha(0.08);
  for (const [dx, dy, dr] of dots) {
    ctx.beginPath();
    ctx.arc(dx, dy, dr, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Top gradient bar ──────────────────────────────────────
  const topBarGrad = ctx.createLinearGradient(0, 0, W, 0);
  topBarGrad.addColorStop(0, "#7C3AED");
  topBarGrad.addColorStop(0.5, accent);
  topBarGrad.addColorStop(1, "#06B6D4");
  ctx.fillStyle = topBarGrad;
  ctx.fillRect(0, 0, W, 5);

  // ── Profile picture ───────────────────────────────────────
  const cx = W / 2;
  const cy = 390;
  const pR = 130; // profile radius

  // Outer glow ring
  ctx.save();
  ctx.shadowColor = accent;
  ctx.shadowBlur = 50;
  ctx.strokeStyle = accentAlpha(0.0);
  ctx.lineWidth = 0;
  ctx.beginPath();
  ctx.arc(cx, cy, pR + 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Soft glow halo
  const haloGrad = ctx.createRadialGradient(cx, cy, pR, cx, cy, pR + 60);
  haloGrad.addColorStop(0, accentAlpha(0.25));
  haloGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, pR + 60, 0, Math.PI * 2);
  ctx.fill();

  // Profile image clipped to circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, pR, 0, Math.PI * 2);
  ctx.clip();

  if (profileImg) {
    ctx.drawImage(profileImg, cx - pR, cy - pR, pR * 2, pR * 2);
  } else {
    // Gradient fallback
    const avatarGrad = ctx.createLinearGradient(cx - pR, cy - pR, cx + pR, cy + pR);
    avatarGrad.addColorStop(0, "#7C3AED");
    avatarGrad.addColorStop(1, "#06B6D4");
    ctx.fillStyle = avatarGrad;
    ctx.fillRect(cx - pR, cy - pR, pR * 2, pR * 2);

    // Initial letter
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "bold 96px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(profile.displayName?.charAt(0)?.toUpperCase() || "?", cx, cy + 4);
  }
  ctx.restore();

  // Profile border ring
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, pR + 2, 0, Math.PI * 2);
  ctx.stroke();

  // Thin outer accent ring
  ctx.strokeStyle = accentAlpha(0.25);
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(cx, cy, pR + 14, 0, Math.PI * 2);
  ctx.stroke();

  // ── Logo badge (superscript top-right of profile) ─────────
  const badgeX = cx + pR * 0.72;
  const badgeY = cy - pR * 0.72;
  const bR = 32;

  // Badge shadow glow
  ctx.save();
  ctx.shadowColor = accent;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, bR, 0, Math.PI * 2);
  ctx.fillStyle = "#0A0A0A";
  ctx.fill();
  ctx.restore();

  // Badge border
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, bR, 0, Math.PI * 2);
  ctx.stroke();

  if (logoImg) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, bR - 4, 0, Math.PI * 2);
    ctx.clip();
    const lSize = (bR - 4) * 2;
    ctx.drawImage(logoImg, badgeX - (bR - 4), badgeY - (bR - 4), lSize, lSize);
    ctx.restore();
  } else {
    ctx.font = "24px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("👻", badgeX, badgeY + 2);
  }

  // ── Display name ──────────────────────────────────────────
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 52px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(
    profile.displayName?.length > 20
      ? profile.displayName.slice(0, 18) + "…"
      : (profile.displayName || "Anonymous"),
    cx,
    cy + pR + 68
  );

  // ── @username ─────────────────────────────────────────────
  ctx.fillStyle = accent;
  ctx.font = "500 30px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(`@${profile.username}`, cx, cy + pR + 112);

  // ── Divider ───────────────────────────────────────────────
  const divY = cy + pR + 148;
  const divGrad = ctx.createLinearGradient(cx - 200, divY, cx + 200, divY);
  divGrad.addColorStop(0, "rgba(0,0,0,0)");
  divGrad.addColorStop(0.5, accentAlpha(0.4));
  divGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 220, divY);
  ctx.lineTo(cx + 220, divY);
  ctx.stroke();

  // ── Type badge pill ───────────────────────────────────────
  const badgeText = `${typeConfig.emoji}  ${typeConfig.badgeLabel.toUpperCase()}`;
  ctx.font = "bold 24px 'Segoe UI', Arial, sans-serif";
  const pillW = ctx.measureText(badgeText).width + 52;
  const pillH = 54;
  const pillX = (W - pillW) / 2;
  const pillY = divY + 30;

  // Pill background
  ctx.fillStyle = accentAlpha(0.14);
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, 27);
  ctx.fill();
  // Pill border
  ctx.strokeStyle = accentAlpha(0.4);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, 27);
  ctx.stroke();
  // Pill text
  ctx.fillStyle = accent;
  ctx.font = "bold 24px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(badgeText, cx, pillY + pillH / 2 + 1);

  // ── Prompt text ───────────────────────────────────────────
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.font = "500 31px 'Segoe UI', Arial, sans-serif";
  const promptLines = wrapText(ctx, typeConfig.prompt, W - 200).slice(0, 2);
  const promptStartY = pillY + pillH + 50;
  for (let i = 0; i < promptLines.length; i++) {
    ctx.fillText(promptLines[i], cx, promptStartY + i * 46);
  }

  // ── Link pill ─────────────────────────────────────────────
  const linkY = promptStartY + promptLines.length * 46 + 46;
  const rawLink = linkUrl.replace(/^https?:\/\//, "");
  const displayLink = rawLink.length > 42 ? rawLink.slice(0, 40) + "…" : rawLink;

  ctx.font = "600 22px 'Segoe UI', Arial, sans-serif";
  const linkPillW = Math.min(ctx.measureText(displayLink).width + 80, W - 120);
  const linkPillH = 66;
  const linkPillX = (W - linkPillW) / 2;

  // Link pill bg
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.beginPath();
  ctx.roundRect(linkPillX, linkY, linkPillW, linkPillH, 33);
  ctx.fill();
  // Link pill border
  ctx.strokeStyle = accentAlpha(0.28);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(linkPillX, linkY, linkPillW, linkPillH, 33);
  ctx.stroke();
  // Link text
  ctx.fillStyle = accentAlpha(0.88);
  ctx.font = "600 22px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(displayLink, cx, linkY + linkPillH / 2);

  // ── Branding footer ───────────────────────────────────────
  ctx.textBaseline = "alphabetic";
  ctx.save();
  ctx.shadowColor = accentAlpha(0.5);
  ctx.shadowBlur = 20;
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 36px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Inkognito", cx, H - 70);
  ctx.restore();

  ctx.fillStyle = "rgba(255,255,255,0.32)";
  ctx.font = "500 20px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("Say it. Anonymously. 👻", cx, H - 36);

  // ── Bottom gradient bar ───────────────────────────────────
  ctx.fillStyle = topBarGrad;
  ctx.fillRect(0, H - 5, W, 5);

  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob!), "image/png");
  });
}

// ── Share (Web Share API → download fallback) ─────────────────
export async function shareProfileCard(
  profile: CardProfile,
  typeConfig: MessageTypeConfig,
  linkUrl: string
): Promise<void> {
  const blob = await generateProfileCard(profile, typeConfig, linkUrl);
  const file = new File(
    [blob],
    `inkognito-${typeConfig.key}-${profile.username}.png`,
    { type: "image/png" }
  );

  if (navigator.share && navigator.canShare({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: `${profile.displayName} on Inkognito`,
      text: `${typeConfig.prompt} 👻\n${linkUrl}`,
    });
  } else {
    downloadProfileCard(profile, typeConfig, linkUrl);
  }
}

// ── Download ──────────────────────────────────────────────────
export async function downloadProfileCard(
  profile: CardProfile,
  typeConfig: MessageTypeConfig,
  linkUrl: string
): Promise<void> {
  const blob = await generateProfileCard(profile, typeConfig, linkUrl);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inkognito-${typeConfig.key}-${profile.username}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
