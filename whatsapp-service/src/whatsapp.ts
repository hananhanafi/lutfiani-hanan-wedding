import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
  fetchLatestWaWebVersion,
  WASocket,
  proto,
  downloadMediaMessage,
  getContentType,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import path from "path";
import fs from "fs";
import QRCode from "qrcode";

const AUTH_BASE_DIR = path.resolve("auth_state");
const logger = pino({ level: process.env.LOG_LEVEL ?? "silent" });

export type ConnectionStatus = "disconnected" | "connecting" | "qr" | "connected";

export interface WAEvent {
  type: "connection" | "qr" | "message";
  sessionId: string;
  data: unknown;
}

export type EventListener = (event: WAEvent) => void;

class WhatsAppClient {
  public readonly sessionId: string;
  private authDir: string;
  private sock: WASocket | null = null;
  private status: ConnectionStatus = "disconnected";
  private qrCode: string | null = null;
  private listeners: EventListener[] = [];
  private retryCount = 0;
  private maxRetries = 5;
  // Passive address-book store (phone -> name). Populated only from WhatsApp's
  // contact app-state sync — never from message content.
  private contacts = new Map<string, string>();

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.authDir = path.join(AUTH_BASE_DIR, sessionId);
  }

  /** Merge a batch of WhatsApp contacts into the store (individuals only, no groups). */
  private upsertContacts(list: Array<{ id?: string; name?: string; notify?: string; verifiedName?: string }> | undefined) {
    for (const c of list ?? []) {
      const jid = c?.id ?? "";
      if (!jid.endsWith("@s.whatsapp.net")) continue; // skip groups / broadcast / status
      const phone = jid.split("@")[0].split(":")[0];
      if (!/^\d{6,}$/.test(phone)) continue;
      const name = (c.name || c.notify || c.verifiedName || "").trim();
      const existing = this.contacts.get(phone);
      // Prefer a real name; keep an existing name if the update has none.
      this.contacts.set(phone, name || existing || "");
    }
  }

  /** Return the connected account's address-book contacts (excludes self). */
  getContacts(): { phone: string; name: string }[] {
    const self = this.getPhoneNumber();
    return Array.from(this.contacts.entries())
      .filter(([phone]) => phone !== self)
      .map(([phone, name]) => ({ phone, name }))
      .sort((a, b) => (a.name || "~").localeCompare(b.name || "~"));
  }

  /** Force WhatsApp to re-push app-state (incl. contacts). Best-effort, user-triggered. */
  async refreshContacts(): Promise<void> {
    if (!this.sock || this.status !== "connected") throw new Error("Session not connected");
    try {
      await this.sock.resyncAppState(
        ["critical_block", "critical_unblock_low", "regular_high", "regular_low", "regular"],
        false
      );
    } catch {
      // keys may not be ready yet — store still reflects whatever synced on connect
    }
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  getQR(): string | null {
    return this.qrCode;
  }

  getPhoneNumber(): string | null {
    return this.sock?.user?.id?.split(":")[0] ?? null;
  }

  /** Display name of the connected WhatsApp account (own profile name), if available. */
  getName(): string | null {
    return this.sock?.user?.name ?? this.sock?.user?.verifiedName ?? null;
  }

  on(listener: EventListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit(event: WAEvent) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // listener error shouldn't crash
      }
    }
  }

  async connect() {
    if (!fs.existsSync(this.authDir)) {
      fs.mkdirSync(this.authDir, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(this.authDir);

    this.status = "connecting";
    this.emit({ type: "connection", sessionId: this.sessionId, data: { status: "connecting" } });

    // Fetch latest WA version to avoid 405 rejection
    const { version } = await fetchLatestWaWebVersion({}).catch(() => ({ version: undefined }));
    console.log("Using WA version:", version);

    this.sock = makeWASocket({
      auth: state,
      logger,
      browser: Browsers.windows("Chrome"),
      version,
      // Contacts only — do not pull or process message history.
      syncFullHistory: false,
      shouldSyncHistoryMessage: () => false,
    });

    this.sock.ev.on("creds.update", saveCreds);

    // Capture the address book from app-state sync (contacts only, never messages).
    this.sock.ev.on("contacts.upsert", (contacts) => this.upsertContacts(contacts));
    this.sock.ev.on("contacts.update", (updates) => this.upsertContacts(updates));
    this.sock.ev.on("messaging-history.set", ({ contacts }) => this.upsertContacts(contacts));

    this.sock.ev.on("connection.update", (update) => {
      console.log(`[${this.sessionId}] Connection update`);
      const { connection, lastDisconnect, qr } = update;
      console.log(`[${this.sessionId}] status: ${connection}, error: ${lastDisconnect?.error?.message || "none"}`);

      if (qr) {
        this.qrCode = qr;
        this.status = "qr";
        this.emit({ type: "qr", sessionId: this.sessionId, data: { qr } });
        // Print QR in terminal
        QRCode.toString(qr, { type: "terminal", small: true }, (_err, str) => {
          if (str) console.log("\n" + str);
          console.log(`[${this.sessionId}] Scan QR code above with WhatsApp, or visit /qr/image\n`);
        });
      }

      if (connection === "close") {
        const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const errorMsg = lastDisconnect?.error?.message ?? "unknown";
        console.log(`[${this.sessionId}] Connection closed. Reason code: ${reason}, message: ${errorMsg}`);

        if (reason === DisconnectReason.loggedOut || reason === DisconnectReason.connectionReplaced || reason === 401) {
          console.log(`[${this.sessionId}] Session invalid. Clearing auth...`);
          this.status = "disconnected";
          this.qrCode = null;
          this.sock = null;
          this.retryCount = 0;
          if (fs.existsSync(this.authDir)) {
            fs.rmSync(this.authDir, { recursive: true, force: true });
          }
          this.emit({ type: "connection", sessionId: this.sessionId, data: { status: "disconnected", reason: "logged_out" } });
        } else if (reason === DisconnectReason.restartRequired) {
          console.log(`[${this.sessionId}] Restart required. Reconnecting...`);
          setTimeout(() => this.connect(), 1000);
        } else if (reason === DisconnectReason.connectionClosed || reason === DisconnectReason.connectionLost || reason === DisconnectReason.timedOut) {
          if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            const delay = Math.min(1000 * Math.pow(2, this.retryCount), 30000);
            console.log(`[${this.sessionId}] Retrying in ${delay}ms (${this.retryCount}/${this.maxRetries})...`);
            setTimeout(() => this.connect(), delay);
          } else {
            console.log(`[${this.sessionId}] Max retries reached.`);
            this.status = "disconnected";
            this.emit({ type: "connection", sessionId: this.sessionId, data: { status: "disconnected", reason: "max_retries" } });
          }
        } else {
          console.log(`[${this.sessionId}] Unknown disconnect (${reason}). Clearing auth...`);
          this.status = "disconnected";
          this.qrCode = null;
          this.sock = null;
          this.retryCount = 0;
          if (fs.existsSync(this.authDir)) {
            fs.rmSync(this.authDir, { recursive: true, force: true });
          }
          this.emit({ type: "connection", sessionId: this.sessionId, data: { status: "disconnected", reason: "connection_failure" } });
        }
      }

      if (connection === "open") {
        this.status = "connected";
        this.qrCode = null;
        this.retryCount = 0;
        console.log(`[${this.sessionId}] Connected as ${this.getPhoneNumber()}`);
        this.emit({ type: "connection", sessionId: this.sessionId, data: { status: "connected", phone: this.getPhoneNumber() } });
      }
    });

    // Handle incoming messages
    this.sock.ev.on("messages.upsert", (m) => {
      for (const msg of m.messages) {
        if (msg.key.fromMe) continue;

        const contentType = getContentType(msg.message!);
        const text =
          msg.message?.conversation ??
          msg.message?.extendedTextMessage?.text ??
          msg.message?.imageMessage?.caption ??
          "";

        this.emit({
          type: "message",
          sessionId: this.sessionId,
          data: {
            from: msg.key.remoteJid?.replace("@s.whatsapp.net", ""),
            pushName: msg.pushName,
            text,
            contentType,
            timestamp: msg.messageTimestamp,
            messageId: msg.key.id,
            hasMedia: !!(
              msg.message?.imageMessage ??
              msg.message?.videoMessage ??
              msg.message?.documentMessage ??
              msg.message?.audioMessage
            ),
          },
        });
      }
    });
  }

  async disconnect() {
    if (this.sock) {
      await this.sock.logout();
      this.sock = null;
      this.status = "disconnected";
      this.qrCode = null;
    }
  }

  async requestPairingCode(phoneNumber: string): Promise<string> {
    if (!this.sock) {
      throw new Error("Socket not initialized. Connect first.");
    }
    // Clean: digits only, no +, spaces, dashes
    const cleaned = phoneNumber.replace(/[^0-9]/g, "");
    if (!cleaned) throw new Error("Invalid phone number");
    const code = await this.sock.requestPairingCode(cleaned);
    return code;
  }

  async sendText(to: string, text: string): Promise<proto.WebMessageInfo> {
    if (!this.sock || this.status !== "connected") {
      throw new Error("WhatsApp not connected");
    }

    const jid = this.formatJid(to);
    const result = await this.sock.sendMessage(jid, { text });
    return result!;
  }

  async sendImage(
    to: string,
    imageBuffer: Buffer,
    caption?: string,
    mimetype?: string
  ): Promise<proto.WebMessageInfo> {
    if (!this.sock || this.status !== "connected") {
      throw new Error("WhatsApp not connected");
    }

    const jid = this.formatJid(to);
    const result = await this.sock.sendMessage(jid, {
      image: imageBuffer,
      caption: caption ?? "",
      mimetype: (mimetype as any) ?? "image/jpeg",
    });
    return result!;
  }

  async sendImageUrl(
    to: string,
    imageUrl: string,
    caption?: string,
  ): Promise<proto.WebMessageInfo> {
    if (!this.sock || this.status !== "connected") {
      throw new Error("WhatsApp not connected");
    }

    const jid = this.formatJid(to);
    const result = await this.sock.sendMessage(jid, {
      image: { url: imageUrl },
      caption: caption ?? "",
    });
    return result!;
  }

  async sendDocument(
    to: string,
    docBuffer: Buffer,
    filename: string,
    mimetype: string,
    caption?: string
  ): Promise<proto.WebMessageInfo> {
    if (!this.sock || this.status !== "connected") {
      throw new Error("WhatsApp not connected");
    }

    const jid = this.formatJid(to);
    const result = await this.sock.sendMessage(jid, {
      document: docBuffer,
      fileName: filename,
      mimetype: mimetype as any,
      caption: caption ?? "",
    });
    return result!;
  }

  async sendVideo(
    to: string,
    videoBuffer: Buffer,
    caption?: string,
    mimetype?: string
  ): Promise<proto.WebMessageInfo> {
    if (!this.sock || this.status !== "connected") {
      throw new Error("WhatsApp not connected");
    }

    const jid = this.formatJid(to);
    const result = await this.sock.sendMessage(jid, {
      video: videoBuffer,
      caption: caption ?? "",
      mimetype: (mimetype as any) ?? "video/mp4",
    });
    return result!;
  }

  isConnected(): boolean {
    return this.status === "connected";
  }

  /** List the WhatsApp groups this account participates in (jid + subject). */
  async getGroups(): Promise<{ jid: string; subject: string }[]> {
    if (!this.sock || this.status !== "connected") {
      throw new Error("WhatsApp not connected");
    }
    const all = await this.sock.groupFetchAllParticipating();
    return Object.values(all)
      .map((g) => ({ jid: g.id, subject: g.subject ?? "" }))
      .sort((a, b) => a.subject.localeCompare(b.subject));
  }

  private formatJid(phone: string): string {
    // Pass through full JIDs (groups @g.us, users @s.whatsapp.net) untouched
    if (phone.endsWith("@g.us") || phone.endsWith("@s.whatsapp.net")) return phone;
    // Otherwise treat as a phone number → user JID
    const digits = phone.replace(/\D/g, "");
    return `${digits}@s.whatsapp.net`;
  }
}

// Session Manager — handles multiple WhatsApp connections
class SessionManager {
  private sessions = new Map<string, WhatsAppClient>();
  private listeners: EventListener[] = [];

  on(listener: EventListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private forwardEvents(client: WhatsAppClient) {
    client.on((event) => {
      for (const listener of this.listeners) {
        try { listener(event); } catch {}
      }
    });
  }

  getSession(sessionId: string): WhatsAppClient | undefined {
    return this.sessions.get(sessionId);
  }

  createSession(sessionId: string): WhatsAppClient {
    if (this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId)!;
    }
    const client = new WhatsAppClient(sessionId);
    this.sessions.set(sessionId, client);
    this.forwardEvents(client);
    return client;
  }

  deleteSession(sessionId: string): boolean {
    const client = this.sessions.get(sessionId);
    if (!client) return false;
    client.disconnect().catch(() => {});
    this.sessions.delete(sessionId);
    // Clean auth dir
    const authDir = path.join(AUTH_BASE_DIR, sessionId);
    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, { recursive: true, force: true });
    }
    return true;
  }

  getAllSessions(): { sessionId: string; status: ConnectionStatus; phone: string | null; name: string | null }[] {
    return Array.from(this.sessions.entries()).map(([id, client]) => ({
      sessionId: id,
      status: client.getStatus(),
      phone: client.getPhoneNumber(),
      name: client.getName(),
    }));
  }

  getConnectedSessions(): WhatsAppClient[] {
    return Array.from(this.sessions.values()).filter((c) => c.isConnected());
  }

  // Auto-restore sessions from auth_state directories on startup
  async restoreAll() {
    if (!fs.existsSync(AUTH_BASE_DIR)) return;
    const dirs = fs.readdirSync(AUTH_BASE_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    for (const sessionId of dirs) {
      const credsPath = path.join(AUTH_BASE_DIR, sessionId, "creds.json");
      if (fs.existsSync(credsPath)) {
        console.log(`Restoring session: ${sessionId}`);
        const client = this.createSession(sessionId);
        try {
          await client.connect();
        } catch (err) {
          console.error(`Failed to restore ${sessionId}:`, (err as Error).message);
        }
      }
    }
  }
}

export const sessionManager = new SessionManager();

// Backward compat: default session
export const waClient = {
  getStatus: () => sessionManager.getSession("default")?.getStatus() ?? "disconnected",
  getQR: () => sessionManager.getSession("default")?.getQR() ?? null,
  getPhoneNumber: () => sessionManager.getSession("default")?.getPhoneNumber() ?? null,
  getName: () => sessionManager.getSession("default")?.getName() ?? null,
  isConnected: () => sessionManager.getSession("default")?.isConnected() ?? false,
  connect: () => { const s = sessionManager.createSession("default"); return s.connect(); },
  disconnect: () => sessionManager.getSession("default")?.disconnect() ?? Promise.resolve(),
  sendText: (to: string, text: string) => {
    const s = sessionManager.getSession("default");
    if (!s) throw new Error("Default session not found");
    return s.sendText(to, text);
  },
  sendImage: (to: string, buf: Buffer, caption?: string, mime?: string) => {
    const s = sessionManager.getSession("default");
    if (!s) throw new Error("Default session not found");
    return s.sendImage(to, buf, caption, mime);
  },
  sendDocument: (to: string, buf: Buffer, filename: string, mime: string, caption?: string) => {
    const s = sessionManager.getSession("default");
    if (!s) throw new Error("Default session not found");
    return s.sendDocument(to, buf, filename, mime, caption);
  },
  sendVideo: (to: string, buf: Buffer, caption?: string, mime?: string) => {
    const s = sessionManager.getSession("default");
    if (!s) throw new Error("Default session not found");
    return s.sendVideo(to, buf, caption, mime);
  },
  on: (listener: EventListener) => sessionManager.on(listener),
};
