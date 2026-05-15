import QRCode from "qrcode";

const QR_OPTIONS: QRCode.QRCodeToDataURLOptions = {
  width: 400,
  margin: 2,
  color: { dark: "#3a3028", light: "#fffbf5" },
};

/**
 * Generate a QR code data URL for a guest pass URL.
 * Returns a base64 PNG data URL.
 */
export async function generatePassQrDataUrl(passUrl: string): Promise<string> {
  return QRCode.toDataURL(passUrl, QR_OPTIONS);
}

/**
 * Strip the data URL prefix and return the raw base64 string
 * suitable for use as a nodemailer attachment.
 */
export function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.replace(/^data:image\/png;base64,/, "");
}

/**
 * Build the guest pass URL from the app base URL and a guest token.
 */
export function buildPassUrl(token: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${appUrl}/pass?token=${token}`;
}
