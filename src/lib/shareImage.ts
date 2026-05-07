/**
 * Generates a premium branded Inkognito message card as a downloadable image.
 * Uses HTML Canvas API with gradients, glow effects, and decorative elements.
 * Size: 1080×1350 (Instagram story optimized)
 */
export async function generateMessageImage(
  messageContent: string,
  username: string
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const W = 1080;
  const H = 1350;
  canvas.width = W;
  canvas.height = H;

  // === BACKGROUND ===
  // Rich dark gradient background
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, "#0A0A0A");
  bgGrad.addColorStop(0.5, "#0F0A1A");
  bgGrad.addColorStop(1, "#0A0A0A");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // === AMBIENT GLOW ORBS ===
  // Top-left violet glow
  const glow1 = ctx.createRadialGradient(100, 200, 0, 100, 200, 400);
  glow1.addColorStop(0, "rgba(124, 58, 237, 0.15)");
  glow1.addColorStop(1, "rgba(124, 58, 237, 0)");
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, W, H);

  // Bottom-right cyan glow
  const glow2 = ctx.createRadialGradient(W - 150, H - 300, 0, W - 150, H - 300, 450);
  glow2.addColorStop(0, "rgba(6, 182, 212, 0.12)");
  glow2.addColorStop(1, "rgba(6, 182, 212, 0)");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, W, H);

  // Center violet accent
  const glow3 = ctx.createRadialGradient(W / 2, H / 2 - 50, 0, W / 2, H / 2 - 50, 350);
  glow3.addColorStop(0, "rgba(139, 92, 246, 0.08)");
  glow3.addColorStop(1, "rgba(139, 92, 246, 0)");
  ctx.fillStyle = glow3;
  ctx.fillRect(0, 0, W, H);

  // === TOP GRADIENT BAR ===
  const topGrad = ctx.createLinearGradient(0, 0, W, 0);
  topGrad.addColorStop(0, "#7C3AED");
  topGrad.addColorStop(0.5, "#8B5CF6");
  topGrad.addColorStop(1, "#06B6D4");
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, W, 6);

  // === DECORATIVE FLOATING ELEMENTS ===
  ctx.globalAlpha = 0.06;
  ctx.font = "120px sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("👻", 60, 180);
  ctx.fillText("💬", W - 200, 250);
  ctx.fillText("✨", 80, H - 200);
  ctx.fillText("🔥", W - 180, H - 250);
  ctx.globalAlpha = 1;

  // === SMALL DECORATIVE DOTS ===
  ctx.fillStyle = "rgba(139, 92, 246, 0.08)";
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = Math.random() * 2 + 0.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // === MAIN MESSAGE CARD ===
  const cardX = 60;
  const cardY = 280;
  const cardW = W - 120;
  const cardH = H - 520;
  const cardR = 32;

  // Card shadow
  ctx.shadowColor = "rgba(139, 92, 246, 0.15)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 10;

  // Card fill with subtle gradient
  const cardGradFill = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
  cardGradFill.addColorStop(0, "#161622");
  cardGradFill.addColorStop(1, "#141418");
  ctx.fillStyle = cardGradFill;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, cardR);
  ctx.fill();

  // Reset shadow
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Card border with gradient
  ctx.strokeStyle = "rgba(139, 92, 246, 0.25)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, cardR);
  ctx.stroke();

  // Card top accent gradient bar
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, 5, [cardR, cardR, 0, 0]);
  ctx.clip();
  ctx.fillStyle = topGrad;
  ctx.fillRect(cardX, cardY, cardW, 5);
  ctx.restore();

  // === GHOST ICON + "Someone sent you a message" ===
  ctx.font = "48px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("👻", W / 2, cardY + 70);

  ctx.fillStyle = "rgba(167, 139, 250, 0.8)";
  ctx.font = "bold 22px 'Segoe UI', sans-serif";
  ctx.fillText("Someone sent you a message", W / 2, cardY + 110);

  // Decorative line under label
  const lineGrad = ctx.createLinearGradient(W / 2 - 120, 0, W / 2 + 120, 0);
  lineGrad.addColorStop(0, "rgba(139, 92, 246, 0)");
  lineGrad.addColorStop(0.5, "rgba(139, 92, 246, 0.4)");
  lineGrad.addColorStop(1, "rgba(139, 92, 246, 0)");
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 140, cardY + 130);
  ctx.lineTo(W / 2 + 140, cardY + 130);
  ctx.stroke();

  // === MESSAGE CONTENT ===
  // Dynamic font size based on message length
  const msgLen = messageContent.length;
  let fontSize = 48;
  let lineHeight = 64;
  let maxLines = 6;
  if (msgLen > 200) { fontSize = 26; lineHeight = 38; maxLines = 12; }
  else if (msgLen > 120) { fontSize = 30; lineHeight = 44; maxLines = 10; }
  else if (msgLen > 60) { fontSize = 36; lineHeight = 50; maxLines = 8; }

  ctx.fillStyle = "#FFFFFF";
  ctx.font = `500 ${fontSize}px 'Segoe UI', sans-serif`;
  ctx.textAlign = "center";

  const maxLineWidth = cardW - 120;
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
  if (lines.length > maxLines) displayLines[maxLines - 1] = displayLines[maxLines - 1] + "...";

  const totalTextH = displayLines.length * lineHeight;
  const availableSpace = cardH - 220;
  const textStartY = cardY + 160 + (availableSpace - totalTextH) / 2;

  // Opening quote mark
  ctx.fillStyle = "rgba(139, 92, 246, 0.3)";
  ctx.font = "bold 80px Georgia, serif";
  ctx.textAlign = "left";
  ctx.fillText("\u201C", cardX + 40, textStartY - 10);

  // Message text
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "500 36px 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  for (let i = 0; i < displayLines.length; i++) {
    ctx.fillText(displayLines[i], W / 2, textStartY + i * lineHeight);
  }

  // Closing quote mark
  ctx.fillStyle = "rgba(139, 92, 246, 0.3)";
  ctx.font = "bold 80px Georgia, serif";
  ctx.textAlign = "right";
  ctx.fillText("\u201D", cardX + cardW - 40, textStartY + totalTextH + 20);

  // === BOTTOM DIVIDER ===
  ctx.strokeStyle = lineGrad;
  ctx.beginPath();
  ctx.moveTo(cardX + 60, cardY + cardH - 80);
  ctx.lineTo(cardX + cardW - 60, cardY + cardH - 80);
  ctx.stroke();

  // === USERNAME at bottom of card ===
  ctx.fillStyle = "#A78BFA";
  ctx.font = "bold 26px 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`@${username}`, W / 2, cardY + cardH - 42);

  // === BOTTOM BRANDING ===
  // Inkognito logo text with glow
  ctx.shadowColor = "rgba(139, 92, 246, 0.4)";
  ctx.shadowBlur = 20;
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 40px 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Inkognito", W / 2, H - 130);
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;

  // Tagline
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.font = "500 22px 'Segoe UI', sans-serif";
  ctx.fillText("Say it. Anonymously. 👻", W / 2, H - 88);

  // CTA
  ctx.fillStyle = "rgba(167, 139, 250, 0.6)";
  ctx.font = "bold 18px 'Segoe UI', sans-serif";
  ctx.fillText("inkog.vercel.app", W / 2, H - 55);

  // === BOTTOM GRADIENT BAR ===
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, H - 6, W, 6);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/png");
  });
}

export async function downloadMessageImage(
  messageContent: string,
  username: string
) {
  const blob = await generateMessageImage(messageContent, username);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inkognito-message-${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function shareMessageImage(
  messageContent: string,
  username: string
) {
  const blob = await generateMessageImage(messageContent, username);
  const file = new File([blob], "inkognito-message.png", { type: "image/png" });

  if (navigator.share && navigator.canShare({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: "Inkognito Message",
      text: "Check out this anonymous message I got on Inkognito! 👻",
    });
  } else {
    await downloadMessageImage(messageContent, username);
  }
}
