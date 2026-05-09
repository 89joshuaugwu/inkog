import { MessageTypeConfig } from "@/lib/messageTypes";

interface CardProfile {
  displayName: string;
  username: string;
  photoURL?: string;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "inkog.vercel.app";

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

  // ── Accent color ────────────────────────────────────────────
  const rgbMatch = typeConfig.badgeBorder.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  const [R, G, B] = rgbMatch
    ? [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3])]
    : [139, 92, 246];
  const accent      = `rgb(${R}, ${G}, ${B})`;
  const accentAlpha = (a: number) => `rgba(${R}, ${G}, ${B}, ${a})`;

  // ── Load assets ─────────────────────────────────────────────
  const [logoImg, profileImg] = await Promise.all([
    loadImage("/logo.png"),
    profile.photoURL ? loadImage(profile.photoURL) : Promise.resolve(null),
  ]);

  // ── FIX 1: Solid dark background first ─────────────────────
  ctx.fillStyle = "#0A0A0A";
  ctx.fillRect(0, 0, W, H);

  // ── FIX 2: Blurred profile photo as atmospheric background ──
  if (profileImg) {
    ctx.save();
    ctx.filter = "blur(55px)";
    ctx.globalAlpha = 0.28;
    // Draw oversized to prevent blur edge artifacts
    ctx.drawImage(profileImg, -120, -120, W + 240, H + 240);
    ctx.filter = "none";
    ctx.globalAlpha = 1;
    ctx.restore();

    // Dark scrim to keep the dark premium feel
    const scrim = ctx.createLinearGradient(0, 0, 0, H);
    scrim.addColorStop(0, "rgba(6, 4, 16, 0.80)");
    scrim.addColorStop(0.4, "rgba(6, 4, 16, 0.72)");
    scrim.addColorStop(1, "rgba(6, 4, 16, 0.82)");
    ctx.fillStyle = scrim;
    ctx.fillRect(0, 0, W, H);
  }

  // ── Accent gradient overlay ─────────────────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, accentAlpha(0.10));
  bgGrad.addColorStop(0.5, "rgba(0,0,0,0)");
  bgGrad.addColorStop(1, accentAlpha(0.07));
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // ── Ambient glow centered on profile ───────────────────────
  const ambientGrad = ctx.createRadialGradient(W / 2, 370, 0, W / 2, 370, 380);
  ambientGrad.addColorStop(0, accentAlpha(0.22));
  ambientGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = ambientGrad;
  ctx.fillRect(0, 0, W, H);

  // Corner accents
  const cornerGlow1 = ctx.createRadialGradient(0, 0, 0, 0, 0, 300);
  cornerGlow1.addColorStop(0, accentAlpha(0.12));
  cornerGlow1.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = cornerGlow1;
  ctx.fillRect(0, 0, W, H);

  const cornerGlow2 = ctx.createRadialGradient(W, H, 0, W, H, 300);
  cornerGlow2.addColorStop(0, "rgba(6,182,212,0.12)");
  cornerGlow2.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = cornerGlow2;
  ctx.fillRect(0, 0, W, H);

  // ── FIX 3: Logo watermark — increased opacity ───────────────
  if (logoImg) {
    ctx.save();
    ctx.globalAlpha = 0.07; // was 0.035 — now visible
    ctx.filter = "blur(20px)";
    const wmSize = 660;
    ctx.drawImage(logoImg, (W - wmSize) / 2, (H - wmSize) / 2, wmSize, wmSize);
    ctx.filter = "none";
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ── Decorative dots ─────────────────────────────────────────
  const dots = [
    [90, 120, 3], [990, 160, 2], [140, 920, 2.5], [940, 880, 3],
    [540, 60, 2], [60, 540, 2], [1020, 540, 2], [300, 980, 2],
    [780, 960, 2.5], [200, 300, 1.5], [860, 280, 1.5],
  ];
  ctx.fillStyle = accentAlpha(0.1);
  for (const [dx, dy, dr] of dots) {
    ctx.beginPath();
    ctx.arc(dx, dy, dr, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Top gradient bar ────────────────────────────────────────
  const topBarGrad = ctx.createLinearGradient(0, 0, W, 0);
  topBarGrad.addColorStop(0, "#7C3AED");
  topBarGrad.addColorStop(0.5, accent);
  topBarGrad.addColorStop(1, "#06B6D4");
  ctx.fillStyle = topBarGrad;
  ctx.fillRect(0, 0, W, 6);

  // ── Profile picture ─────────────────────────────────────────
  const cx = W / 2;
  const cy = 375;
  const pR = 128;

  // Halo glow
  const haloGrad = ctx.createRadialGradient(cx, cy, pR, cx, cy, pR + 70);
  haloGrad.addColorStop(0, accentAlpha(0.3));
  haloGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, pR + 70, 0, Math.PI * 2);
  ctx.fill();

  // Profile image clipped to circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, pR, 0, Math.PI * 2);
  ctx.clip();

  if (profileImg) {
    ctx.drawImage(profileImg, cx - pR, cy - pR, pR * 2, pR * 2);
  } else {
    const avatarGrad = ctx.createLinearGradient(cx - pR, cy - pR, cx + pR, cy + pR);
    avatarGrad.addColorStop(0, "#7C3AED");
    avatarGrad.addColorStop(1, "#06B6D4");
    ctx.fillStyle = avatarGrad;
    ctx.fillRect(cx - pR, cy - pR, pR * 2, pR * 2);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "bold 96px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(profile.displayName?.charAt(0)?.toUpperCase() || "?", cx, cy + 4);
  }
  ctx.restore();

  // Border ring
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, pR + 2, 0, Math.PI * 2);
  ctx.stroke();

  // Outer accent ring
  ctx.strokeStyle = accentAlpha(0.28);
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(cx, cy, pR + 14, 0, Math.PI * 2);
  ctx.stroke();

  // ── Logo badge (superscript top-right) ──────────────────────
  const badgeX = cx + pR * 0.72;
  const badgeY = cy - pR * 0.72;
  const bR = 32;

  ctx.save();
  ctx.shadowColor = accent;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, bR, 0, Math.PI * 2);
  ctx.fillStyle = "#0A0A0A";
  ctx.fill();
  ctx.restore();

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

  // ── Display name ────────────────────────────────────────────
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 50px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(
    profile.displayName?.length > 22
      ? profile.displayName.slice(0, 20) + "…"
      : (profile.displayName || "Anonymous"),
    cx,
    cy + pR + 64
  );

  // ── @username ────────────────────────────────────────────────
  ctx.fillStyle = accent;
  ctx.font = "500 28px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(`@${profile.username}`, cx, cy + pR + 104);

  // ── Divider ──────────────────────────────────────────────────
  const divY = cy + pR + 138;
  const divGrad = ctx.createLinearGradient(cx - 200, divY, cx + 200, divY);
  divGrad.addColorStop(0, "rgba(0,0,0,0)");
  divGrad.addColorStop(0.5, accentAlpha(0.45));
  divGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 220, divY);
  ctx.lineTo(cx + 220, divY);
  ctx.stroke();

  // ── Type badge pill ──────────────────────────────────────────
  const badgeText = `${typeConfig.emoji}  ${typeConfig.badgeLabel.toUpperCase()}`;
  ctx.font = "bold 24px 'Segoe UI', Arial, sans-serif";
  const pillW = ctx.measureText(badgeText).width + 52;
  const pillH = 52;
  const pillX = (W - pillW) / 2;
  const pillY = divY + 26;

  ctx.fillStyle = accentAlpha(0.16);
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, 26);
  ctx.fill();

  ctx.strokeStyle = accentAlpha(0.42);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, 26);
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.font = "bold 24px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(badgeText, cx, pillY + pillH / 2 + 1);

  // ── Prompt text ──────────────────────────────────────────────
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(255,255,255,0.70)";
  ctx.font = "500 30px 'Segoe UI', Arial, sans-serif";
  const promptLines = wrapText(ctx, typeConfig.prompt, W - 180).slice(0, 2);
  const promptStartY = pillY + pillH + 46;
  for (let i = 0; i < promptLines.length; i++) {
    ctx.fillText(promptLines[i], cx, promptStartY + i * 44);
  }

  // ── Link pill ────────────────────────────────────────────────
  const linkY = promptStartY + promptLines.length * 44 + 38;
  const rawLink = linkUrl.replace(/^https?:\/\//, "");
  const displayLink = rawLink.length > 44 ? rawLink.slice(0, 42) + "…" : rawLink;

  ctx.font = "600 21px 'Segoe UI', Arial, sans-serif";
  const linkPillW = Math.min(ctx.measureText(displayLink).width + 80, W - 120);
  const linkPillH = 62;
  const linkPillX = (W - linkPillW) / 2;

  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.beginPath();
  ctx.roundRect(linkPillX, linkY, linkPillW, linkPillH, 31);
  ctx.fill();

  ctx.strokeStyle = accentAlpha(0.3);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(linkPillX, linkY, linkPillW, linkPillH, 31);
  ctx.stroke();

  ctx.fillStyle = accentAlpha(0.9);
  ctx.font = "600 21px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(displayLink, cx, linkY + linkPillH / 2);

  // ── Footer branding ──────────────────────────────────────────
  const footerY = linkY + linkPillH + 36;

  ctx.textBaseline = "alphabetic";
  ctx.save();
  ctx.shadowColor = accentAlpha(0.55);
  ctx.shadowBlur = 22;
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 34px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Inkognito", cx, footerY);
  ctx.restore();

  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "500 19px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("Say it. Anonymously. 👻", cx, footerY + 32);

  // ── FIX 4: URL line in footer (was missing) ─────────────────
  ctx.fillStyle = accentAlpha(0.6);
  ctx.font = "bold 17px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(APP_URL, cx, footerY + 58);

  // ── Bottom gradient bar ──────────────────────────────────────
  ctx.fillStyle = topBarGrad;
  ctx.fillRect(0, H - 6, W, 6);

  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob!), "image/png");
  });
}

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
