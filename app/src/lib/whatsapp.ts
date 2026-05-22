const GRAPH_API_URL = "https://graph.facebook.com/v21.0";

interface SendTemplateParams {
  to: string; // phone number in international format without '+' (e.g. "6281234567890")
  templateName: string;
  languageCode: string;
  parameters: string[]; // positional body parameters
}

interface SendTextParams {
  to: string;
  text: string;
}

interface WhatsAppApiResponse {
  messaging_product: string;
  contacts: { input: string; wa_id: string }[];
  messages: { id: string }[];
}

function getConfig() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    throw new Error("WhatsApp Business API not configured. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN.");
  }

  return { phoneNumberId, accessToken };
}

/**
 * Format phone number to WhatsApp format (digits only, with country code).
 * Handles Indonesian numbers starting with 0 or +62.
 */
export function formatPhoneForWA(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  if (digits.startsWith("62")) return digits;
  return digits;
}

/**
 * Send a pre-approved template message via WhatsApp Cloud API.
 */
export async function sendTemplateMessage({
  to,
  templateName,
  languageCode,
  parameters,
}: SendTemplateParams): Promise<{ messageId: string }> {
  const { phoneNumberId, accessToken } = getConfig();

  const body = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components: [
        {
          type: "body",
          parameters: parameters.map((text) => ({ type: "text", text })),
        },
      ],
    },
  };

  const res = await fetch(`${GRAPH_API_URL}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `WhatsApp API error (${res.status}): ${JSON.stringify(err?.error?.message ?? err)}`
    );
  }

  const data: WhatsAppApiResponse = await res.json();
  return { messageId: data.messages[0].id };
}

/**
 * Send a free-form text message (only works within 24h conversation window).
 */
export async function sendTextMessage({ to, text }: SendTextParams): Promise<{ messageId: string }> {
  const { phoneNumberId, accessToken } = getConfig();

  const body = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: text },
  };

  const res = await fetch(`${GRAPH_API_URL}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `WhatsApp API error (${res.status}): ${JSON.stringify(err?.error?.message ?? err)}`
    );
  }

  const data: WhatsAppApiResponse = await res.json();
  return { messageId: data.messages[0].id };
}
