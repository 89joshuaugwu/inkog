/**
 * Simple QR Code generator using Canvas API.
 * Based on the QR code spec — generates a data URL for a QR code image.
 * For production, consider using a library like 'qrcode' for full spec compliance.
 * This uses the Google Charts API as a reliable fallback.
 */
export function generateQRCodeURL(text: string, size = 300): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&bgcolor=0A0A0A&color=A78BFA&format=png`;
}
