/**
 * Generates a branded Inkognito message card as a downloadable image.
 * Uses HTML Canvas API to render a premium dark card with gradient accents.
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

  // Background
  ctx.fillStyle = "#0A0A0A";
  ctx.fillRect(0, 0, W, H);

  // Subtle noise texture overlay
  ctx.fillStyle = "rgba(139, 92, 246, 0.03)";
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    ctx.fillRect(x, y, 2, 2);
  }

  // Top gradient bar
  const topGrad = ctx.createLinearGradient(0, 0, W, 0);
  topGrad.addColorStop(0, "#7C3AED");
  topGrad.addColorStop(1, "#06B6D4");
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, W, 6);

  // Card background
  const cardX = 60;
  const cardY = 200;
  const cardW = W - 120;
  const cardH = H - 440;
  const cardRadius = 32;

  ctx.fillStyle = "#141414";
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, cardRadius);
  ctx.fill();

  // Card border
  ctx.strokeStyle = "rgba(139, 92, 246, 0.3)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, cardRadius);
  ctx.stroke();

  // Card top gradient accent
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, 6, [cardRadius, cardRadius, 0, 0]);
  ctx.clip();
  const cardGrad = ctx.createLinearGradient(cardX, 0, cardX + cardW, 0);
  cardGrad.addColorStop(0, "#7C3AED");
  cardGrad.addColorStop(1, "#06B6D4");
  ctx.fillStyle = cardGrad;
  ctx.fillRect(cardX, cardY, cardW, 6);
  ctx.restore();

  // "Anonymous message" label
  ctx.fillStyle = "#6B7280";
  ctx.font = "bold 28px 'Plus Jakarta Sans', 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Someone sent you a message 👻", W / 2, cardY + 70);

  // Message content — word-wrap
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "500 38px 'Plus Jakarta Sans', 'Segoe UI', sans-serif";
  ctx.textAlign = "center";

  const maxLineWidth = cardW - 100;
  const words = messageContent.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? currentLine + " " + word : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxLineWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  // Limit to 8 lines
  const displayLines = lines.slice(0, 8);
  if (lines.length > 8) displayLines[7] = displayLines[7] + "...";

  const lineHeight = 52;
  const totalTextHeight = displayLines.length * lineHeight;
  const textStartY = cardY + (cardH - totalTextHeight) / 2 + 30;

  for (let i = 0; i < displayLines.length; i++) {
    ctx.fillText(displayLines[i], W / 2, textStartY + i * lineHeight);
  }

  // Reaction emoji row (bottom of card)
  ctx.fillStyle = "#6B7280";
  ctx.font = "24px 'Plus Jakarta Sans', sans-serif";
  ctx.textAlign = "center";

  // Bottom divider line
  ctx.strokeStyle = "rgba(139, 92, 246, 0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX + 40, cardY + cardH - 80);
  ctx.lineTo(cardX + cardW - 40, cardY + cardH - 80);
  ctx.stroke();

  // Username at bottom of card
  ctx.fillStyle = "#A78BFA";
  ctx.font = "bold 28px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText(`@${username}`, W / 2, cardY + cardH - 40);

  // Inkognito branding at very bottom
  ctx.fillStyle = "#6B7280";
  ctx.font = "bold 32px 'Space Grotesk', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Inkognito", W / 2, H - 120);

  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.font = "24px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("Say it. Anonymously. 👻", W / 2, H - 75);

  // Bottom gradient bar
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
    // Fallback: download
    await downloadMessageImage(messageContent, username);
  }
}
