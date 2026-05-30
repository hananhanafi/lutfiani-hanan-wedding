const FONNTE_API_URL = "https://api.fonnte.com/send";

interface SendMessageParams {
  to: string;   // phone number with country code, no '+' (e.g. "6281234567890")
  message: string;
  sessionId?: string; // which WA session to send from (default: "default")
}

function getToken() {
  const token = process.env.FONNTE_TOKEN;
  if (!token) throw new Error("FONNTE_TOKEN is not configured.");
  return token;
}

/**
 * Format phone number for WA (digits only, with country code).
 * Handles Indonesian numbers starting with 0 or +62.
 */
export function formatPhoneForWA(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  if (digits.startsWith("62")) return digits;
  return digits;
}

/**
 * Send a WhatsApp message via self-hosted Baileys service.
 * Falls back to Fonnte if WA_SERVICE_URL is not configured.
 */
export async function sendWhatsAppMessage({ to, message, sessionId }: SendMessageParams): Promise<{ messageId: string }> {
  const serviceUrl = process.env.WA_SERVICE_URL;

  if (serviceUrl) {
    return sendViaSelfHosted({ to, message, sessionId, serviceUrl });
  }

  // Fallback to Fonnte
  return sendFonnteMessage({ to, message });
}

/**
 * Send via self-hosted Baileys WhatsApp service.
 */
async function sendViaSelfHosted({ to, message, sessionId, serviceUrl }: SendMessageParams & { serviceUrl: string }): Promise<{ messageId: string }> {
  const apiKey = process.env.WA_SERVICE_API_KEY ?? "";
  const session = sessionId ?? "default";
  const url = `${serviceUrl.replace(/\/$/, "")}/sessions/${session}/send`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({ to, message }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.success) {
    throw new Error(`WA Service error: ${data.error ?? JSON.stringify(data)}`);
  }

  return { messageId: String(data.messageId ?? "sent") };
}

/**
 * Send bulk messages via self-hosted Baileys WhatsApp service.
 */
export async function sendWhatsAppBulk(
  messages: { to: string; message: string }[],
  sessionId?: string
): Promise<{ sent: number; failed: number; results: { to: string; success: boolean; messageId?: string; error?: string }[] }> {
  const serviceUrl = process.env.WA_SERVICE_URL;

  if (!serviceUrl) {
    throw new Error("WA_SERVICE_URL is not configured. Bulk send requires self-hosted service.");
  }

  const apiKey = process.env.WA_SERVICE_API_KEY ?? "";
  const session = sessionId ?? "default";
  const url = `${serviceUrl.replace(/\/$/, "")}/sessions/${session}/send-bulk`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({ messages }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(`WA Service error: ${data.error ?? JSON.stringify(data)}`);
  }

  return data;
}

/**
 * Check WhatsApp service connection status.
 */
export async function getWhatsAppStatus(sessionId?: string): Promise<{ status: string; phone: string | null; connected: boolean }> {
  const serviceUrl = process.env.WA_SERVICE_URL;
  if (!serviceUrl) {
    return { status: "not_configured", phone: null, connected: false };
  }

  const apiKey = process.env.WA_SERVICE_API_KEY ?? "";
  const session = sessionId ?? "default";
  const url = `${serviceUrl.replace(/\/$/, "")}/sessions/${session}/status`;

  const res = await fetch(url, {
    headers: { "x-api-key": apiKey },
  });

  return res.json();
}

/**
 * List all WhatsApp sessions from the self-hosted service.
 */
export async function getWhatsAppSessions(): Promise<{ sessions: { sessionId: string; status: string; phone: string | null }[] }> {
  const serviceUrl = process.env.WA_SERVICE_URL;
  if (!serviceUrl) {
    return { sessions: [] };
  }

  const apiKey = process.env.WA_SERVICE_API_KEY ?? "";
  const url = `${serviceUrl.replace(/\/$/, "")}/sessions`;

  const res = await fetch(url, {
    headers: { "x-api-key": apiKey },
  });

  return res.json();
}

/**
 * Send a WhatsApp message via Fonnte API (legacy).
 * Returns a messageId (Fonnte's message ID).
 */
export async function sendFonnteMessage({ to, message }: SendMessageParams): Promise<{ messageId: string }> {
  const token = getToken();

  const body = new URLSearchParams({
    target: to,
    message,
  });

  const res = await fetch(FONNTE_API_URL, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.status === false) {
    throw new Error(`Fonnte error: ${JSON.stringify(data?.reason ?? data)}`);
  }

  // Fonnte returns { status: true, id: "...", ... }
  return { messageId: String(data.id ?? data.message ?? "sent") };
}
