import { getMessageType } from "@/lib/messageTypes";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "inkog.vercel.app";

export async function generateMessageImage(
  messageContent: string,
  username: string,
  messageType?: string
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const W = 1080;
  const H = 1350;
  canvas.width = W;
  canvas.height = H;

  const config = getMessageType(messageType);

  const rgbMatch = config.badgeBorder.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  const [accentR, accentG, accentB] = rgbMatch
    ? [rgbMatch[1], rgbMatch[2], rgbMatch[3]]
    : ["139", "92", "246"];
  const accent    = `rgb(${accentR}, ${accentG}, ${accentB})`;
  const accentDim = `rgba(${accentR}, ${accentG}, ${accentB}, 0.15)`;
  const accentMid = `rgba(${accentR}, ${accentG}, ${accentB}, 0.35)`;
  const accentGlow = `rgba(${accentR}, ${accentG}, ${accentB}, 0.12)`;

  // ── Background ──────────────────────────────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, "#0A0A0A");
  bgGrad.addColorStop(0.5, "#0F0A1A");
  bgGrad.addColorStop(1, "#0A0A0A");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // ── Ambient glows ───────────────────────────────────────────
  const glow1 = ctx.createRadialGradient(80, 180, 0, 80, 180, 420);
  glow1.addColorStop(0, `rgba(${accentR}, ${accentG}, ${accentB}, 0.14)`);
  glow1.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, W, H);

  const glow2 = ctx.createRadialGradient(W - 120, H - 280, 0, W - 120, H - 280, 460);
  glow2.addColorStop(0, "rgba(6, 182, 212, 0.10)");
  glow2.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, W, H);

  const glow3 = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 380);
  glow3.addColorStop(0, accentGlow);
  glow3.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow3;
  ctx.fillRect(0, 0, W, H);

  // ── Top gradient bar ────────────────────────────────────────
  const topGrad = ctx.createLinearGradient(0, 0, W, 0);
  topGrad.addColorStop(0, "#7C3AED");
  topGrad.addColorStop(0.5, accent);
  topGrad.addColorStop(1, "#06B6D4");
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, W, 6);

  // ── Decorative dots ─────────────────────────────────────────
  const dotPositions = [
    [120, 320], [980, 200], [200, 900], [900, 1100],
    [540, 150], [760, 600], [300, 1200], [820, 380],
    [160, 700], [950, 850], [440, 1280], [680, 480],
    [240, 450], [860, 250], [500, 950], [100, 1050],
    [700, 130], [400, 720], [1000, 680], [350, 1100],
  ];
  ctx.fillStyle = `rgba(${accentR}, ${accentG}, ${accentB}, 0.07)`;
  for (const [x, y] of dotPositions) {
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = `rgba(${accentR}, ${accentG}, ${accentB}, 0.04)`;
  const largeDots = [[80, 600], [1000, 400], [540, 1200], [300, 250], [780, 1050]];
  for (const [x, y] of largeDots) {
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Main card ───────────────────────────────────────────────
  const cardX = 60;
  const cardY = 260;
  const cardW = W - 120;
  const cardH = H - 480;
  const cardR = 36;

  ctx.shadowColor = `rgba(${accentR}, ${accentG}, ${accentB}, 0.2)`;
  ctx.shadowBlur = 70;
  ctx.shadowOffsetY = 16;

  const cardFill = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
  cardFill.addColorStop(0, "#171723");
  cardFill.addColorStop(1, "#141418");
  ctx.fillStyle = cardFill;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, cardR);
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.strokeStyle = accentMid;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, cardR);
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, 5, [cardR, cardR, 0, 0]);
  ctx.clip();
  ctx.fillStyle = topGrad;
  ctx.fillRect(cardX, cardY, cardW, 5);
  ctx.restore();

  // ── Type badge ──────────────────────────────────────────────
  const badgeText = `${config.emoji}  ${config.badgeLabel.toUpperCase()}`;
  ctx.font = "bold 22px 'Segoe UI', Arial, sans-serif";
  const badgeTextW = ctx.measureText(badgeText).width;
  const badgeW = badgeTextW + 48;
  const badgeH = 44;
  const badgeX = (W - badgeW) / 2;
  const badgeY = cardY + 36;

  ctx.fillStyle = accentDim;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 22);
  ctx.fill();

  ctx.strokeStyle = accentMid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 22);
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.font = "bold 22px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(badgeText, W / 2, badgeY + 30);

  // ── Ghost + subtitle ────────────────────────────────────────
  ctx.font = "52px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("👻", W / 2, cardY + 148);

  ctx.fillStyle = "rgba(167, 139, 250, 0.75)";
  ctx.font = "500 24px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Someone sent you a message", W / 2, cardY + 192);

  const divGrad = (y: number) => {
    const g = ctx.createLinearGradient(W / 2 - 160, y, W / 2 + 160, y);
    g.addColorStop(0, "rgba(139,92,246,0)");
    g.addColorStop(0.5, accentMid);
    g.addColorStop(1, "rgba(139,92,246,0)");
    return g;
  };

  ctx.strokeStyle = divGrad(cardY + 210);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 180, cardY + 214);
  ctx.lineTo(W / 2 + 180, cardY + 214);
  ctx.stroke();

  // ── Message content ─────────────────────────────────────────
  const msgLen = messageContent.length;
  let fontSize: number;
  let lineHeight: number;
  let maxLines: number;

  if (msgLen > 250) {
    fontSize = 28; lineHeight = 42; maxLines = 14;
  } else if (msgLen > 180) {
    fontSize = 32; lineHeight = 46; maxLines = 12;
  } else if (msgLen > 120) {
    fontSize = 36; lineHeight = 52; maxLines = 10;
  } else if (msgLen > 60) {
    fontSize = 42; lineHeight = 60; maxLines = 8;
  } else {
    fontSize = 52; lineHeight = 70; maxLines = 6;
  }

  // Word wrap
  ctx.font = `500 ${fontSize}px 'Segoe UI', Arial, sans-serif`;
  const maxLineWidth = cardW - 140;
  const words = messageContent.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? currentLine + " " + word : word;
    if (ctx.measureText(testLine).width > maxLineWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  const displayLines = lines.slice(0, maxLines);
  if (lines.length > maxLines) {
    displayLines[maxLines - 1] = displayLines[maxLines - 1].replace(/\s\S+$/, "") + "…";
  }

  const totalTextH = displayLines.length * lineHeight;

  // ── FIX 1: Cap centering offset so text stays in upper portion ──
  const textAreaTop = cardY + 230;
  const textAreaH = cardH - 310;
  const rawCenterOffset = (textAreaH - totalTextH) / 2;
  const textStartY = textAreaTop + Math.min(rawCenterOffset, 90);

  // Opening quote — left-anchored, top-aligned with first line
  ctx.fillStyle = accentMid;
  ctx.font = `bold ${fontSize + 28}px Georgia, 'Times New Roman', serif`;
  ctx.textAlign = "left";
  ctx.fillText("\u201C", cardX + 44, textStartY + 12);

  // Message text
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `500 ${fontSize}px 'Segoe UI', Arial, sans-serif`;
  ctx.textAlign = "center";
  for (let i = 0; i < displayLines.length; i++) {
    ctx.fillText(displayLines[i], W / 2, textStartY + i * lineHeight);
  }

  // ── FIX 2: Closing quote — hugs last line, not floating ────
  const lastLineBaseline = textStartY + (displayLines.length - 1) * lineHeight;
  const closeQuoteY = lastLineBaseline + Math.round(lineHeight * 0.32) + 18;
  ctx.fillStyle = accentMid;
  ctx.font = `bold ${fontSize + 28}px Georgia, 'Times New Roman', serif`;
  ctx.textAlign = "right";
  ctx.fillText("\u201D", cardX + cardW - 44, closeQuoteY);

  // ── FIX 3: Bottom divider + username follow the content ────
  // Estimate where the quote glyph ends (roughly 55% of font size above baseline)
  const quoteGlyphBottom = closeQuoteY + Math.round((fontSize + 28) * 0.18);
  const dynamicDividerY = quoteGlyphBottom + 58;
  const dynamicUsernameY = quoteGlyphBottom + 100;

  // Clamp: never push below the card bottom margin
  const dividerY = Math.min(dynamicDividerY, cardY + cardH - 88);
  const usernameY = Math.min(dynamicUsernameY, cardY + cardH - 42);

  ctx.strokeStyle = divGrad(dividerY);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX + 60, dividerY);
  ctx.lineTo(cardX + cardW - 60, dividerY);
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.font = "bold 28px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`@${username}`, W / 2, usernameY);

  // ── Bottom branding ─────────────────────────────────────────
  ctx.shadowColor = `rgba(${accentR}, ${accentG}, ${accentB}, 0.5)`;
  ctx.shadowBlur = 24;
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 44px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Inkognito", W / 2, H - 140);
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;

  ctx.fillStyle = "rgba(255, 255, 255, 0.38)";
  ctx.font = "500 24px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("Say it. Anonymously. 👻", W / 2, H - 96);

  ctx.fillStyle = `rgba(${accentR}, ${accentG}, ${accentB}, 0.65)`;
  ctx.font = "bold 20px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(APP_URL, W / 2, H - 58);

  // ── Bottom gradient bar ─────────────────────────────────────
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, H - 6, W, 6);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/png");
  });
}

export async function downloadMessageImage(
  messageContent: string,
  username: string,
  messageType?: string
) {
  const blob = await generateMessageImage(messageContent, username, messageType);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inkognito-${messageType || "message"}-${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function shareMessageImage(
  messageContent: string,
  username: string,
  messageType?: string
) {
  const blob = await generateMessageImage(messageContent, username, messageType);
  const file = new File([blob], `inkognito-${messageType || "message"}.png`, {
    type: "image/png",
  });

  if (navigator.share && navigator.canShare({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: "Inkognito Message",
      text: `Check out this anonymous ${messageType || "message"} I got on Inkognito! 👻`,
    });
  } else {
    await downloadMessageImage(messageContent, username, messageType);
  }
}
