import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";
import admin from "firebase-admin";

const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "20kb" }));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "https://localhost,capacitor://localhost,http://localhost:5173")
  .split(",").map(value => value.trim()).filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin not allowed"));
  },
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use("/api", rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false
}));

const requiredEnv = ["OPENAI_API_KEY", "FIREBASE_SERVICE_ACCOUNT_JSON", "ADMIN_EMAIL"];
const missing = requiredEnv.filter(key => !process.env[key]);
if (missing.length) {
  console.error("Missing required environment variables:", missing.join(", "));
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const ADMIN_EMAIL = process.env.ADMIN_EMAIL.trim().toLowerCase();
const MODEL = process.env.OPENAI_MODEL || "gpt-6.2-astra";

async function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) return res.status(401).json({ error: "Sign-in required." });

    const decoded = await admin.auth().verifyIdToken(match[1], true);
    if (!decoded.email || decoded.email.toLowerCase() !== ADMIN_EMAIL || decoded.email_verified !== true) {
      return res.status(403).json({ error: "Admin access denied. A verified admin account is required." });
    }
    req.admin = { uid: decoded.uid, email: decoded.email };
    next();
  } catch {
    return res.status(401).json({ error: "Your session is invalid or expired. Please sign in again." });
  }
}

app.get("/health", (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({ ok: true, service: "doodle-outpost-ai-agent", aiConfigured: Boolean(process.env.OPENAI_API_KEY) });
});

app.get("/api/admin/me", requireAdmin, (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({ ok: true, email: req.admin.email, role: "admin" });
});

app.post("/api/agent/chat", requireAdmin, async (req, res) => {
  const prompt = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!prompt) return res.status(400).json({ error: "Enter a message." });
  if (prompt.length > 12000) return res.status(413).json({ error: "Message is too long (maximum 12,000 characters)." });

  try {
    const response = await openai.responses.create({
      model: MODEL,
      instructions: [
        "You are the private Doodle Outpost game development assistant.",
        "Help the sole authorized developer inspect, understand, test, and improve their game.",
        "Be clear about the difference between code inspection and real gameplay testing.",
        "Never claim to have changed GitHub files, deployed code, or run tests unless a connected tool actually did so.",
        "You may propose patches and explain them, but publishing always requires explicit approval from the developer.",
        "Never request passwords, API keys, Firebase service-account secrets, or other credentials."
      ].join("\n"),
      input: prompt,
      max_output_tokens: 1400
    });
    res.json({ ok: true, model: MODEL, answer: response.output_text || "The AI returned no text. Please try again." });
  } catch (error) {
    console.error("OpenAI request failed:", error?.status || error?.name || "unknown");
    res.status(502).json({ error: "The AI service could not complete that request. Check backend configuration and API usage, then try again." });
  }
});

app.use((err, _req, res, _next) => {
  if (err?.message === "Origin not allowed") return res.status(403).json({ error: "Origin not allowed." });
  console.error("Request error:", err?.message || "unknown");
  res.status(400).json({ error: "Invalid request." });
});

const port = Number(process.env.PORT || 8787);
app.listen(port, "0.0.0.0", () => {
  console.log(`Doodle Outpost AI Agent backend listening on ${port}`);
});