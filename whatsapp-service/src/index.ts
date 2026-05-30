import dotenv from "dotenv";
dotenv.config({ path: [".env.local", ".env"] });
import express from "express";
import multer from "multer";
import fs from "fs";
import QRCode from "qrcode";
import { waClient, sessionManager } from "./whatsapp.js";

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
const PORT = parseInt(process.env.PORT ?? "3001", 10);
const API_KEY = process.env.API_KEY ?? "";
const WEBHOOK_URL = process.env.WEBHOOK_URL ?? "";

// Middleware
app.use(express.json());

// Auth middleware
function auth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const key = (req.headers["x-api-key"] ?? req.query.apiKey ?? "") as string;
  if (!key || key !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// ─── Health & Status ──────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "ok", whatsapp: waClient.getStatus(), phone: waClient.getPhoneNumber() });
});

app.get("/status", auth, (_req, res) => {
  res.json({
    status: waClient.getStatus(),
    phone: waClient.getPhoneNumber(),
    connected: waClient.isConnected(),
  });
});

// ─── QR Code & Auth ───────────────────────────────────────────

app.get("/qr", auth, async (_req, res) => {
  let qr = waClient.getQR();

  // Wait up to 10 seconds for QR to become available
  if (!qr && (waClient.getStatus() === "connecting" || waClient.getStatus() === "qr")) {
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 500));
      qr = waClient.getQR();
      if (qr) break;
    }
  }

  if (!qr) {
    const status = waClient.getStatus();
    if (status === "connected") {
      return res.json({ status: "connected", phone: waClient.getPhoneNumber() });
    }
    return res.json({ status, message: "No QR code available. Try /connect first." });
  }

  // Return QR as base64 data URL
  const dataUrl = await QRCode.toDataURL(qr, { width: 300 });
  res.json({ status: "qr", qr: dataUrl });
});

app.get("/qr/image", auth, async (_req, res) => {
  let qr = waClient.getQR();

  // Wait up to 10 seconds for QR to become available
  if (!qr && (waClient.getStatus() === "connecting" || waClient.getStatus() === "qr")) {
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 500));
      qr = waClient.getQR();
      if (qr) break;
    }
  }

  if (!qr) {
    return res.status(404).send("No QR available");
  }
  res.setHeader("Content-Type", "image/png");
  const buffer = await QRCode.toBuffer(qr, { width: 400 });
  res.send(buffer);
});

// ─── Connect / Disconnect ─────────────────────────────────────

app.post("/connect", auth, async (_req, res) => {
  const status = waClient.getStatus();
  if (status === "connected") {
    return res.json({ status: "connected", phone: waClient.getPhoneNumber() });
  }
  if (status === "connecting" || status === "qr") {
    return res.json({ status, message: "Already connecting. Check /qr for QR code." });
  }

  try {
    waClient.connect(); // don't await — let it run in background

    // Wait up to 15 seconds for QR or connected state
    let qr: string | null = null;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 500));
      qr = waClient.getQR();
      if (qr || waClient.isConnected()) break;
    }

    if (waClient.isConnected()) {
      return res.json({ status: "connected", phone: waClient.getPhoneNumber() });
    }

    if (qr) {
      const dataUrl = await QRCode.toDataURL(qr, { width: 300 });
      return res.json({ status: "qr", qr: dataUrl, message: "Scan QR code with WhatsApp" });
    }

    res.json({ status: waClient.getStatus(), message: "Connecting... Check /qr for QR code." });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Connection failed" });
  }
});

app.post("/connect/fresh", auth, async (_req, res) => {
  // Clear old auth state and start fresh — forces new QR
  try {
    if (waClient.isConnected()) {
      await waClient.disconnect();
    }
    const authDir = "auth_state";
    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, { recursive: true, force: true });
    }

    waClient.connect();

    // Wait for QR
    let qr: string | null = null;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 500));
      qr = waClient.getQR();
      if (qr) break;
    }

    if (qr) {
      const dataUrl = await QRCode.toDataURL(qr, { width: 300 });
      return res.json({ status: "qr", qr: dataUrl, message: "Scan QR code with WhatsApp" });
    }

    res.json({ status: waClient.getStatus(), message: "Connecting... Check /qr for QR code." });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Fresh connect failed" });
  }
});

app.post("/disconnect", auth, async (_req, res) => {
  try {
    await waClient.disconnect();
    res.json({ status: "disconnected" });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Disconnect failed" });
  }
});

// ─── Send Text Message ────────────────────────────────────────

app.post("/send", auth, async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ error: "Missing 'to' and 'message' fields" });
  }

  try {
    const result = await waClient.sendText(to, message);
    res.json({
      success: true,
      messageId: result.key.id,
      to,
      timestamp: result.messageTimestamp,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Send failed",
    });
  }
});

// ─── Send Bulk Messages ───────────────────────────────────────

app.post("/send-bulk", auth, async (req, res) => {
  const { messages } = req.body as { messages: { to: string; message: string }[] };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Missing 'messages' array" });
  }

  if (messages.length > 50) {
    return res.status(400).json({ error: "Maximum 50 messages per batch" });
  }

  const results: { to: string; success: boolean; messageId?: string; error?: string }[] = [];

  for (const { to, message } of messages) {
    try {
      const result = await waClient.sendText(to, message);
      results.push({ to, success: true, messageId: result.key.id ?? undefined });

      // Delay between messages to avoid rate limiting
      await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000));
    } catch (err) {
      results.push({ to, success: false, error: err instanceof Error ? err.message : "Failed" });
    }
  }

  const sent = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  res.json({ sent, failed, results });
});

// ─── Send Media ───────────────────────────────────────────────

app.post("/send-image", auth, upload.single("image"), async (req, res) => {
  const { to, caption } = req.body;
  const file = req.file;

  if (!to || !file) {
    return res.status(400).json({ error: "Missing 'to' field or image file" });
  }

  try {
    const result = await waClient.sendImage(to, file.buffer, caption, file.mimetype);
    res.json({ success: true, messageId: result.key.id, to });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Send failed" });
  }
});

app.post("/send-document", auth, upload.single("document"), async (req, res) => {
  const { to, caption, filename } = req.body;
  const file = req.file;

  if (!to || !file) {
    return res.status(400).json({ error: "Missing 'to' field or document file" });
  }

  try {
    const result = await waClient.sendDocument(
      to,
      file.buffer,
      filename ?? file.originalname,
      file.mimetype,
      caption
    );
    res.json({ success: true, messageId: result.key.id, to });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Send failed" });
  }
});

app.post("/send-video", auth, upload.single("video"), async (req, res) => {
  const { to, caption } = req.body;
  const file = req.file;

  if (!to || !file) {
    return res.status(400).json({ error: "Missing 'to' field or video file" });
  }

  try {
    const result = await waClient.sendVideo(to, file.buffer, caption, file.mimetype);
    res.json({ success: true, messageId: result.key.id, to });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Send failed" });
  }
});

// ─── Multi-Session Endpoints ─────────────────────────────────

// List all sessions
app.get("/sessions", auth, (_req, res) => {
  res.json({ sessions: sessionManager.getAllSessions() });
});

// Create a session/device (without connecting)
app.post("/sessions", auth, (req, res) => {
  const { id, name } = req.body;
  if (!id) return res.status(400).json({ error: "Missing 'id' (unique session identifier)" });
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    return res.status(400).json({ error: "Session id must be alphanumeric (a-z, 0-9, _, -)" });
  }

  const existing = sessionManager.getSession(id);
  if (existing) {
    return res.status(409).json({ error: "Session already exists", sessionId: id, status: existing.getStatus() });
  }

  sessionManager.createSession(id);
  res.status(201).json({ sessionId: id, name: name ?? id, status: "disconnected", message: "Session created. Use POST /sessions/:id/connect to pair." });
});

// Create/connect a session
app.post("/sessions/:id/connect", auth, async (req, res) => {
  const id = req.params.id as string;
  const client = sessionManager.createSession(id);

  const status = client.getStatus();
  if (status === "connected") {
    return res.json({ sessionId: id, status: "connected", phone: client.getPhoneNumber() });
  }
  if (status === "connecting" || status === "qr") {
    const qr = client.getQR();
    if (qr) {
      const dataUrl = await QRCode.toDataURL(qr, { width: 300 });
      return res.json({ sessionId: id, status: "qr", qr: dataUrl });
    }
    return res.json({ sessionId: id, status, message: "Connecting..." });
  }

  try {
    client.connect();

    // Wait for QR or connection
    let qr: string | null = null;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 500));
      qr = client.getQR();
      if (qr || client.isConnected()) break;
    }

    if (client.isConnected()) {
      return res.json({ sessionId: id, status: "connected", phone: client.getPhoneNumber() });
    }
    if (qr) {
      const dataUrl = await QRCode.toDataURL(qr, { width: 300 });
      return res.json({ sessionId: id, status: "qr", qr: dataUrl });
    }

    res.json({ sessionId: id, status: client.getStatus(), message: "Connecting..." });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Connect failed" });
  }
});

// Connect fresh (clear auth)
app.post("/sessions/:id/connect/fresh", auth, async (req, res) => {
  const id = req.params.id as string;
  // Delete existing session data
  sessionManager.deleteSession(id);
  const client = sessionManager.createSession(id);

  try {
    client.connect();

    let qr: string | null = null;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 500));
      qr = client.getQR();
      if (qr) break;
    }

    if (qr) {
      const dataUrl = await QRCode.toDataURL(qr, { width: 300 });
      return res.json({ sessionId: id, status: "qr", qr: dataUrl });
    }

    res.json({ sessionId: id, status: client.getStatus(), message: "Connecting..." });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Connect failed" });
  }
});

// Get session status
app.get("/sessions/:id/status", auth, (req, res) => {
  const id = req.params.id as string;
  const client = sessionManager.getSession(id);
  if (!client) return res.status(404).json({ error: "Session not found" });
  res.json({ sessionId: id, status: client.getStatus(), phone: client.getPhoneNumber(), connected: client.isConnected() });
});

// Get QR for session
app.get("/sessions/:id/qr", auth, async (req, res) => {
  const id = req.params.id as string;
  const client = sessionManager.getSession(id);
  if (!client) return res.status(404).json({ error: "Session not found" });

  let qr = client.getQR();
  if (!qr && (client.getStatus() === "connecting" || client.getStatus() === "qr")) {
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 500));
      qr = client.getQR();
      if (qr) break;
    }
  }

  if (!qr) {
    if (client.isConnected()) return res.json({ status: "connected", phone: client.getPhoneNumber() });
    return res.json({ status: client.getStatus(), message: "No QR available" });
  }

  const dataUrl = await QRCode.toDataURL(qr, { width: 300 });
  res.json({ status: "qr", qr: dataUrl });
});

// Disconnect a session
app.post("/sessions/:id/disconnect", auth, async (req, res) => {
  const id = req.params.id as string;
  const client = sessionManager.getSession(id);
  if (!client) return res.status(404).json({ error: "Session not found" });
  await client.disconnect();
  res.json({ sessionId: id, status: "disconnected" });
});

// Delete a session (disconnect + remove auth)
app.delete("/sessions/:id", auth, async (req, res) => {
  const id = req.params.id as string;
  const deleted = sessionManager.deleteSession(id);
  if (!deleted) return res.status(404).json({ error: "Session not found" });
  res.json({ sessionId: id, deleted: true });
});

// Send message via specific session
app.post("/sessions/:id/send", auth, async (req, res) => {
  const id = req.params.id as string;
  const client = sessionManager.getSession(id);
  if (!client) return res.status(404).json({ error: "Session not found" });
  if (!client.isConnected()) return res.status(400).json({ error: "Session not connected" });

  const { to, message } = req.body;
  if (!to || !message) return res.status(400).json({ error: "Missing 'to' and 'message'" });

  try {
    const result = await client.sendText(to, message);
    res.json({ success: true, sessionId: id, messageId: result.key.id, to });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Send failed" });
  }
});

// Send image via specific session (supports URL or file upload)
app.post("/sessions/:id/send-image", auth, upload.single("image"), async (req, res) => {
  const id = req.params.id as string;
  const client = sessionManager.getSession(id);
  if (!client) return res.status(404).json({ error: "Session not found" });
  if (!client.isConnected()) return res.status(400).json({ error: "Session not connected" });

  const { to, caption, imageUrl, imageBase64 } = req.body;
  if (!to) return res.status(400).json({ error: "Missing 'to'" });

  try {
    let result;
    if (req.file) {
      // File upload via multipart
      result = await client.sendImage(to, req.file.buffer, caption, req.file.mimetype);
    } else if (imageBase64) {
      // Base64-encoded image
      const buffer = Buffer.from(imageBase64, "base64");
      result = await client.sendImage(to, buffer, caption, "image/png");
    } else if (imageUrl) {
      // URL-based image
      result = await client.sendImageUrl(to, imageUrl, caption);
    } else {
      return res.status(400).json({ error: "Missing 'image' file, 'imageBase64', or 'imageUrl'" });
    }
    res.json({ success: true, sessionId: id, messageId: result.key.id, to });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Send image failed" });
  }
});

// Send bulk via specific session
app.post("/sessions/:id/send-bulk", auth, async (req, res) => {
  const id = req.params.id as string;
  const client = sessionManager.getSession(id);
  if (!client) return res.status(404).json({ error: "Session not found" });
  if (!client.isConnected()) return res.status(400).json({ error: "Session not connected" });

  const { messages } = req.body as { messages: { to: string; message: string }[] };
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Missing 'messages' array" });
  }
  if (messages.length > 50) {
    return res.status(400).json({ error: "Maximum 50 messages per batch" });
  }

  const results: { to: string; success: boolean; messageId?: string; error?: string }[] = [];
  for (const { to, message } of messages) {
    try {
      const result = await client.sendText(to, message);
      results.push({ to, success: true, messageId: result.key.id ?? undefined });
      await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000));
    } catch (err) {
      results.push({ to, success: false, error: err instanceof Error ? err.message : "Failed" });
    }
  }

  const sent = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  res.json({ sessionId: id, sent, failed, results });
});

// ─── Webhook for incoming messages ───────────────────────────

sessionManager.on(async (event) => {
  if (!WEBHOOK_URL) return;

  if (event.type === "message") {
    try {
      await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: event.sessionId, ...event.data as object }),
      });
    } catch {
      // webhook delivery failure is non-critical
    }
  }
});

// ─── Start ────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`WhatsApp service running on http://localhost:${PORT}`);

  // Auto-restore all sessions from auth_state
  sessionManager.restoreAll().then(() => {
    const sessions = sessionManager.getAllSessions();
    if (sessions.length > 0) {
      console.log(`Restored ${sessions.length} session(s):`, sessions.map((s) => `${s.sessionId} (${s.status})`).join(", "));
    } else {
      console.log("No sessions found. POST /sessions/:id/connect to start pairing.");
    }
  }).catch((err) => {
    console.error("Session restore failed:", err.message);
  });
});

export default app;
