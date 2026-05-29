const FONNTE_API_URL = "https://api.fonnte.com/send";

interface SendMessageParams {
  to: string;   // phone number with country code, no '+' (e.g. "6281234567890")
  message: string;
}

function getToken() {
  const token = process.env.FONNTE_TOKEN;
  if (!token) throw new Error("FONNTE_TOKEN is not configured.");
  return token;
}

/**
 * Format phone number for Fonnte (digits only, with country code).
 * Handles Indonesian numbers starting with 0 or +62.
 */
export function formatPhoneForWA(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  if (digits.startsWith("62")) return digits;
  return digits;
}

/**
 * Send a WhatsApp message via Fonnte API.
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

}
