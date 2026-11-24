import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";
import admin from "firebase-admin";

const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "120kb" }));

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
app.use("/api", rateLimit({ windowMs: 60 * 1000, limit: 30, standardHeaders: "draft-7", legacyHeaders: false }));

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

const GAME_REPO = "fashionportfolio8-dot/DOODLE-";
const GAME_BRANCH = "main";
const GITHUB_API = "https://api.github.com";
const TEXT_EXTENSIONS = /\.(html?|css|js|mjs|cjs|json|md|txt|yml|yaml)$/i;

async function requireAdmin(req, res, next) {
  try {
    const match = (req.headers.authorization || "").match(/^Bearer\s+(.+)$/i);
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

async function githubJson(path) {
  const response = await fetch(GITHUB_API + path, {
    headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "Doodle-Outpost-AI-Agent" }
  });
  if (!response.ok) throw new Error("GitHub read failed (" + response.status + ").");
  return response.json();
}
async function readGameFile(path) {
  if (typeof path !== "string" || !path.startsWith("docs/") || path.includes("..") || !TEXT_EXTENSIONS.test(path)) {
    throw new Error("Only text files inside the game docs folder can be opened.");
  }
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  const response = await fetch("https://raw.githubusercontent.com/" + GAME_REPO + "/" + GAME_BRANCH + "/" + encoded, {
    headers: { "User-Agent": "Doodle-Outpost-AI-Agent" }
  });
  if (!response.ok) throw new Error("Could not read that game file (" + response.status + ").");
  const text = await response.text();
  if (text.length > 120000) throw new Error("That file is too large to inspect in the app.");
  return text;
}
async function getGameTree() {
  const data = await githubJson("/repos/" + GAME_REPO + "/git/trees/" + GAME_BRANCH + "?recursive=1");
  if (data.truncated) throw new Error("The repository tree is too large to scan completely.");
  return data.tree.filter(item => item.type === "blob");
}
function staticFindings(files) {
  const findings = [];
  const add = (severity, file, title, detail) => findings.push({ id: String(findings.length + 1), severity, file, title, detail });
  const byPath = new Map(files.map(file => [file.path, file.content]));
  for (const file of files) {
    const lines = file.content.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (/\bTODO\b|\bFIXME\b/i.test(line)) add("info", file.path, "Developer note", "Line " + (index + 1) + " contains a TODO/FIXME note.");
      if (/\bdebugger\s*;/.test(line)) add("warning", file.path, "Debugger statement", "Line " + (index + 1) + " contains a debugger statement.");
    });
    if (/\.catch\s*\(\s*\(?\s*\)?\s*=>\s*\{\s*\}\s*\)/.test(file.content)) {
      add("warning", file.path, "Empty error handler", "An empty catch handler may hide a failed operation.");
    }
  }
  for (const required of ["docs/index.html", "docs/js/game.js", "docs/js/ui.js", "docs/css/style.css", "docs/manifest.json", "docs/sw.js"]) {
    if (!byPath.has(required)) add("high", required, "Required game file missing", "The expected game file was not found on the main branch.");
  }
  if (!findings.length) add("info", "Repository", "No simple static warnings found", "This quick scan checks common source markers and required files; it is not a full gameplay test.");
  return findings.slice(0, 100);
}

app.get("/health", (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({ ok: true, service: "doodle-outpost-ai-agent", aiConfigured: Boolean(process.env.OPENAI_API_KEY) });
});
app.get("/api/admin/me", requireAdmin, (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({ ok: true, email: req.admin.email, role: "admin" });
});

app.get("/api/admin/game/tree", requireAdmin, async (_req, res) => {
  try {
    const tree = await getGameTree();
    const files = tree.filter(item => item.path.startsWith("docs/") && TEXT_EXTENSIONS.test(item.path))
      .map(item => ({ path: item.path, size: item.size || 0, sha: item.sha }))
      .sort((a, b) => a.path.localeCompare(b.path));
    res.set("Cache-Control", "no-store").json({ ok: true, repository: GAME_REPO, branch: GAME_BRANCH, count: files.length, files });
  } catch (error) { res.status(502).json({ error: error.message || "Could not load game files." }); }
});

app.get("/api/admin/game/file", requireAdmin, async (req, res) => {
  try {
    const path = String(req.query.path || "");
    const content = await readGameFile(path);
    res.set("Cache-Control", "no-store").json({ ok: true, path, content });
  } catch (error) { res.status(400).json({ error: error.message || "Could not open game file." }); }
});

app.get("/api/admin/game/commits", requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 10));
    const commits = await githubJson("/repos/" + GAME_REPO + "/commits?per_page=" + limit);
    res.set("Cache-Control", "no-store").json({ ok: true, commits: commits.map(item => ({
      sha: item.sha, shortSha: item.sha.slice(0, 7), message: item.commit?.message || "Commit",
      date: item.commit?.author?.date || null, author: item.commit?.author?.name || "Unknown",
      url: item.html_url
    })) });
  } catch (error) { res.status(502).json({ error: error.message || "Could not load version history." }); }
});

app.post("/api/admin/game/scan", requireAdmin, async (_req, res) => {
  try {
    const tree = await getGameTree();
    const candidates = tree.filter(item => item.path.startsWith("docs/") && TEXT_EXTENSIONS.test(item.path) && (item.path === "docs/index.html" || item.path === "docs/manifest.json" || item.path === "docs/sw.js" || item.path.startsWith("docs/js/") || item.path.startsWith("docs/css/")));
    const selected = candidates.filter(item => (item.size || 0) <= 120000).slice(0, 45);
    const files = await Promise.all(selected.map(async item => {
      try { return { path: item.path, content: await readGameFile(item.path) }; }
      catch { return null; }
    }));
    const readable = files.filter(Boolean);
    const findings = staticFindings(readable);
    res.set("Cache-Control", "no-store").json({
      ok: true, repository: GAME_REPO, branch: GAME_BRANCH,
      scannedFiles: readable.length, totalTextFiles: candidates.length,
      findings, note: "Static source scan only. It does not launch the game or simulate gameplay."
    });
  } catch (error) { res.status(502).json({ error: error.message || "Game scan failed." }); }
});

app.post("/api/admin/game/review", requireAdmin, async (req, res) => {
  const path = String(req.body?.path || "");
  const instruction = typeof req.body?.instruction === "string" ? req.body.instruction.trim() : "";
  if (!instruction || instruction.length > 4000) return res.status(400).json({ error: "Enter a review instruction (maximum 4,000 characters)." });
  try {
    let content;
    let reviewScope = "The selected file was read successfully.";
    try {
      content = await readGameFile(path);
    } catch {
      const tree = await getGameTree();
      const nearby = tree.filter(item => item.type === "blob" && item.path.startsWith("docs/") && TEXT_EXTENSIONS.test(item.path) && item.path !== path)
        .sort((a, b) => {
          const dir = path.split("/").slice(0, -1).join("/");
          return Number(b.path.startsWith(dir + "/")) - Number(a.path.startsWith(dir + "/"));
        }).slice(0, 4);
      const excerpts = await Promise.all(nearby.map(async item => {
        try { return "\\n--- " + item.path + " ---\\n" + (await readGameFile(item.path)).slice(0, 18000); }
        catch { return ""; }
      }));
      content = "TARGET FILE: " + path + "\\nThe target file could not be read or may be missing. Here are related existing files for context:\\n" + excerpts.join("\\n");
      reviewScope = "The target file was unavailable. AI reviewed related files only; it may recommend creating the missing file, but cannot verify or apply a fix.";
    }
    const response = await openai.responses.create({
      model: MODEL,
      instructions: [
        "You are the private senior developer for the Doodle Outpost game.",
        "Review the supplied source context and the developer's request.",
        "Explain confirmed issues separately from possible risks. Never invent test results.",
        "If a fix is appropriate, provide a proposed patch or complete replacement snippet and explain it.",
        "If the target file is missing, say so clearly and explain whether it should be created or whether another path is correct.",
        "Do not claim to edit, commit, deploy, or publish anything. This endpoint is read-only.",
        "Never request or expose credentials."
      ].join("\\n"),
      input: "Developer request: " + instruction + "\\n\\nFile: " + path + "\\n\\nReview scope: " + reviewScope + "\\n\\nSource context:\\n" + content,
      max_output_tokens: 2600
    });
    res.json({ ok: true, path, review: response.output_text || "No review text was returned." });
  } catch (error) {
    console.error("AI review failed:", error?.status || error?.name || "unknown");
    res.status(502).json({ error: "AI code review failed. Check the AI service configuration and try again." });
  }
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
app.listen(port, "0.0.0.0", () => console.log("Doodle Outpost AI Agent backend listening on " + port));
