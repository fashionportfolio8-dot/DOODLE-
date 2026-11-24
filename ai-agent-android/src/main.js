import "./style.css";
import { auth, ADMIN_EMAIL } from "./firebase.js";
import { onAuthStateChanged, sendEmailVerification, signInWithEmailAndPassword, signOut } from "firebase/auth";

const API_BASE = "https://doodle-outpost-ai-agent.onrender.com";
const app = document.querySelector("#app");
const modules = [
  ["scanner", "Game Scanner", "Scan game source files for common issues.", "⌕"],
  ["bugs", "Bug Reports", "Review findings from the latest source scan.", "⌁"],
  ["testing", "Testing Lab", "Run safe static project checks.", "▷"],
  ["developer", "AI Developer", "Ask AI to review a real game file and propose a fix.", "⌘"],
  ["github", "GitHub Manager", "Browse game files in read-only mode.", "⑂"],
  ["versions", "Version History", "Review recent commits on the game main branch.", "◷"]
];
let lastScan = null;
let cachedFiles = [];

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}
function renderLogin(message = "") {
  app.innerHTML = '<main class="auth-shell"><section class="auth-card"><div class="brand-mark">DO<span>AI</span></div><p class="eyebrow">PRIVATE DEVELOPER CONSOLE</p><h1>Doodle Outpost<br>AI Agent</h1><p class="muted">Sign in to your private game development workspace.</p><form id="loginForm"><label>Email address<input id="email" type="email" autocomplete="username" placeholder="Admin email" required /></label><label>Password<input id="password" type="password" autocomplete="current-password" placeholder="Your password" required /></label><button class="primary" type="submit">Sign in →</button><p class="form-message" id="formMessage" role="alert">' + esc(message) + '</p></form><div class="secure-note"><span>●</span> Private admin access</div></section></main>';
  document.querySelector("#loginForm").addEventListener("submit", async event => {
    event.preventDefault();
    const button = event.currentTarget.querySelector("button");
    const message = document.querySelector("#formMessage");
    const email = document.querySelector("#email").value.trim().toLowerCase();
    const password = document.querySelector("#password").value;
    if (email !== ADMIN_EMAIL) { message.textContent = "This account is not authorized."; return; }
    button.disabled = true; button.textContent = "Signing in…";
    try { await signInWithEmailAndPassword(auth, email, password); }
    catch (error) {
      message.textContent = error.code === "auth/invalid-credential" ? "Email or password is incorrect." : error.message;
      button.disabled = false; button.textContent = "Sign in →";
    }
  });
}
async function api(path, options = {}) {
  const token = await auth.currentUser.getIdToken();
  const response = await fetch(API_BASE + path, {
    ...options,
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token, ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed (" + response.status + ").");
  return data;
}
function appendChatMessage(role, message) {
  const list = document.querySelector("#chatMessages");
  const item = document.createElement("div");
  item.className = "chat-message " + role;
  const label = document.createElement("strong"); label.textContent = role === "user" ? "YOU" : "DO AI";
  const body = document.createElement("p"); body.textContent = message;
  item.append(label, body); list.append(item); list.scrollTop = list.scrollHeight;
}
function status(message, error = false) {
  const node = document.querySelector("#workspaceStatus");
  if (node) { node.textContent = message; node.classList.toggle("error-text", error); }
}
function shell(title, description, body) {
  const host = document.querySelector("#workspace");
  host.innerHTML = '<div class="workspace-head"><div><p class="eyebrow">GAME REPOSITORY / MAIN BRANCH</p><h2>' + esc(title) + '</h2><p>' + esc(description) + '</p></div><button class="ghost" id="closeWorkspace">Close ×</button></div>' + body;
  document.querySelector("#closeWorkspace").addEventListener("click", () => { host.innerHTML = ""; });
}
function findingsMarkup(findings) {
  if (!findings || !findings.length) return '<p class="muted">No findings to display. Run a scan first.</p>';
  return '<div class="result-list">' + findings.map(item =>
    '<article class="result-item"><span class="severity ' + esc(item.severity) + '">' + esc(item.severity) + '</span><div><b>' + esc(item.title) + '</b><small>' + esc(item.file) + '</small><p>' + esc(item.detail) + '</p></div></article>'
  ).join("") + '</div>';
}
async function runScan() {
  status("Scanning the game repository…");
  const result = await api("/api/admin/game/scan", { method: "POST", body: "{}" });
  lastScan = result;
  return result;
}
async function openScanner() {
  shell("Game Scanner", "Read-only scan of source files on your game's main branch.", '<div class="tool-actions"><button class="primary" id="runScan">Start game scan</button><span id="workspaceStatus" class="tool-status"></span></div><div id="scanSummary" class="summary-strip">No scan has been run yet.</div><div id="scanResults"></div>');
  document.querySelector("#runScan").addEventListener("click", async event => {
    const button = event.currentTarget; button.disabled = true; button.textContent = "Scanning…";
    try {
      const result = await runScan();
      document.querySelector("#scanSummary").textContent = "Scanned " + result.scannedFiles + " files · " + result.findings.length + " findings";
      document.querySelector("#scanResults").innerHTML = findingsMarkup(result.findings);
      status(result.note);
    } catch (error) { status(error.message, true); }
    finally { button.disabled = false; button.textContent = "Scan again"; }
  });
}
async function openBugs() {
  shell("Bug Reports", "Findings from the latest static source scan. These are review items, not confirmed gameplay defects.", '<div class="tool-actions"><button class="primary" id="refreshBugs">Run / refresh scan</button><span id="workspaceStatus" class="tool-status"></span></div><div id="bugResults">' + (lastScan ? findingsMarkup(lastScan.findings) : '<p class="muted">No bug report yet. Run a scan to create findings.</p>') + '</div>');
  document.querySelector("#refreshBugs").addEventListener("click", async event => {
    const button = event.currentTarget; button.disabled = true; button.textContent = "Checking…";
    try { const result = await runScan(); document.querySelector("#bugResults").innerHTML = findingsMarkup(result.findings); status(result.findings.length + " findings updated."); }
    catch (error) { status(error.message, true); }
    finally { button.disabled = false; button.textContent = "Refresh reports"; }
  });
}
async function openTesting() {
  shell("Testing Lab", "Run safe repository checks. This version does not launch or simulate a live match.", '<div class="tool-actions"><button class="primary" id="runTests">Run project checks</button><span id="workspaceStatus" class="tool-status"></span></div><div id="testResults" class="test-list"><p class="muted">No checks have run yet.</p></div>');
  document.querySelector("#runTests").addEventListener("click", async event => {
    const button = event.currentTarget; button.disabled = true; button.textContent = "Checking…";
    try {
      const result = await runScan();
      const checks = [
        { name: "Repository tree readable", ok: true, detail: "GitHub returned the game repository file tree." },
        { name: "Core game files present", ok: !result.findings.some(x => x.title === "Required game file missing"), detail: "Checked index, game logic, UI, styles, manifest and service worker." },
        { name: "Source scan completed", ok: result.scannedFiles > 0, detail: result.scannedFiles + " text files were inspected." },
        { name: "Gameplay simulation", ok: null, detail: "Not run: this needs a browser-based game test environment." }
      ];
      document.querySelector("#testResults").innerHTML = checks.map(check =>
        '<div class="test-row"><span class="test-state ' + (check.ok === null ? "pending" : check.ok ? "passed" : "failed") + '">' + (check.ok === null ? "NOT RUN" : check.ok ? "PASS" : "CHECK") + '</span><div><b>' + esc(check.name) + '</b><p>' + esc(check.detail) + '</p></div></div>'
      ).join("");
      status("Static checks finished. No game code was changed.");
    } catch (error) { status(error.message, true); }
    finally { button.disabled = false; button.textContent = "Run checks again"; }
  });
}
async function loadFiles() {
  if (cachedFiles.length) return cachedFiles;
  const result = await api("/api/admin/game/tree");
  cachedFiles = result.files;
  return cachedFiles;
}
async function openDeveloper() {
  shell("AI Developer", "Choose a real game source file. AI will review it and propose a fix without editing GitHub.", '<div class="developer-form"><label>Game source file<select id="reviewFile"><option>Loading game files…</option></select></label><label>What should AI inspect or fix?<textarea id="reviewInstruction" rows="3" maxlength="4000" placeholder="Example: Check the combined aim and shoot button for mobile touch issues."></textarea></label><button class="primary" id="reviewCode">Review selected file</button><span id="workspaceStatus" class="tool-status"></span></div><div id="reviewOutput" class="review-output">Your review and proposed changes will appear here. Nothing will be saved or published.</div>');
  try {
    const files = await loadFiles();
    const select = document.querySelector("#reviewFile");
    select.innerHTML = files.map(file => '<option value="' + esc(file.path) + '">' + esc(file.path) + '</option>').join("");
    if (files.some(file => file.path === "docs/js/game.js")) select.value = "docs/js/game.js";
    status(files.length + " game files available.");
  } catch (error) { status(error.message, true); }
  document.querySelector("#reviewCode").addEventListener("click", async event => {
    const button = event.currentTarget;
    const path = document.querySelector("#reviewFile").value;
    const instruction = document.querySelector("#reviewInstruction").value.trim();
    if (!path || !instruction) { status("Choose a file and enter what you want reviewed.", true); return; }
    button.disabled = true; button.textContent = "AI reviewing…"; status("Reading source file and preparing review…");
    try {
      const result = await api("/api/admin/game/review", { method: "POST", body: JSON.stringify({ path, instruction }) });
      document.querySelector("#reviewOutput").textContent = result.review;
      status("Review complete. No files were changed.");
    } catch (error) { status(error.message, true); }
    finally { button.disabled = false; button.textContent = "Review selected file"; }
  });
}
function commitsMarkup(commits) {
  return '<div class="result-list">' + commits.map(item =>
    '<article class="result-item"><span class="commit-sha">' + esc(item.shortSha) + '</span><div><b>' + esc(item.message.split("\n")[0]) + '</b><small>' + esc(item.author) + ' · ' + esc(item.date || "") + '</small><p><a href="' + esc(item.url) + '" target="_blank" rel="noopener noreferrer">Open commit on GitHub ↗</a></p></div></article>'
  ).join("") + '</div>';
}
async function openGithub() {
  shell("GitHub Manager", "Read-only view of the game repository. File editing and publishing are not enabled.", '<div class="tool-actions"><button class="primary" id="loadRepoFiles">Load game files</button><button class="ghost" id="loadRepoCommits">Recent commits</button><span id="workspaceStatus" class="tool-status"></span></div><div class="repo-browser"><div id="repoFiles" class="repo-files">Tap Load game files to browse the repository.</div><pre id="repoPreview" class="file-preview">Select a file to read its contents.</pre></div><div id="repoCommits"></div>');
  document.querySelector("#loadRepoFiles").addEventListener("click", async () => {
    try {
      const files = await loadFiles();
      document.querySelector("#repoFiles").innerHTML = files.map(file => '<button class="file-link" data-path="' + esc(file.path) + '">' + esc(file.path) + '</button>').join("");
      status(files.length + " files loaded from main (read-only).");
      document.querySelectorAll(".file-link").forEach(button => button.addEventListener("click", async () => {
        const preview = document.querySelector("#repoPreview"); preview.textContent = "Loading…";
        try { const result = await api("/api/admin/game/file?path=" + encodeURIComponent(button.dataset.path)); preview.textContent = result.content; }
        catch (error) { preview.textContent = error.message; }
      }));
    } catch (error) { status(error.message, true); }
  });
  document.querySelector("#loadRepoCommits").addEventListener("click", async () => {
    try { const result = await api("/api/admin/game/commits"); document.querySelector("#repoCommits").innerHTML = commitsMarkup(result.commits); }
    catch (error) { status(error.message, true); }
  });
}
async function openVersions() {
  shell("Version History", "Recent commits from the game main branch. This view cannot roll back or modify commits.", '<div class="tool-actions"><button class="primary" id="loadVersions">Load recent versions</button><span id="workspaceStatus" class="tool-status"></span></div><div id="versionResults"></div>');
  document.querySelector("#loadVersions").addEventListener("click", async event => {
    const button = event.currentTarget; button.disabled = true;
    try { const result = await api("/api/admin/game/commits?limit=15"); document.querySelector("#versionResults").innerHTML = commitsMarkup(result.commits); status(result.commits.length + " commits loaded."); }
    catch (error) { status(error.message, true); }
    finally { button.disabled = false; }
  });
}
const openers = { scanner: openScanner, bugs: openBugs, testing: openTesting, developer: openDeveloper, github: openGithub, versions: openVersions };

function renderDashboard(user) {
  const nav = modules.map(item => '<a href="#' + item[0] + '" data-open="' + item[0] + '">' + item[3] + ' <span>' + item[1] + '</span></a>').join("");
  const cards = modules.map(item => '<button class="module-card" data-open="' + item[0] + '"><span class="module-icon">' + item[3] + '</span><h3>' + item[1] + '</h3><p>' + item[2] + '</p><span class="card-arrow">Open workspace →</span></button>').join("");
  app.innerHTML = '<div class="dashboard"><aside class="sidebar"><div class="side-brand"><div class="brand-mark small">DO<span>AI</span></div><div><b>DO AI AGENT</b><small>Developer console</small></div></div><div class="side-label">WORKSPACE</div><nav><a class="active" href="#overview">▦ <span>Overview</span></a>' + nav + '</nav><div class="sidebar-bottom"><span class="status-dot"></span> Admin session active</div></aside><main class="main-content"><header class="topbar"><div><span class="eyebrow">DOODLE OUTPOST / WORKSPACE</span><h1>Developer Dashboard</h1></div><button id="logoutBtn" class="ghost">Sign out ↗</button></header><section class="welcome-panel"><div><p class="eyebrow">PRIVATE AI WORKSPACE</p><h2>Welcome back, Developer.</h2><p>Inspect your game, investigate issues and prepare improvements.</p></div><div class="orb">✳</div></section><div class="section-heading"><div><h2>AI Developer Chat</h2><p>Ask your private assistant about Doodle Outpost.</p></div><span class="admin-chip">● ADMIN</span></div><section class="chat-panel"><div class="chat-status"><span class="status-dot"></span> Secured AI assistant</div><div id="chatMessages" class="chat-messages" aria-live="polite"><div class="chat-message assistant"><strong>DO AI</strong><p>Hello! I can answer questions. Use AI Developer to review actual game files. I never publish without your approval.</p></div></div><form id="chatForm" class="chat-form"><textarea id="chatInput" rows="2" maxlength="12000" placeholder="Ask something about your game…" required></textarea><button class="primary" id="sendChat" type="submit">Send message →</button></form><p id="chatError" class="chat-error" role="alert"></p></section><div class="section-heading"><div><h2>Development tools</h2><p>These workspaces connect to your game repository.</p></div></div><section class="module-grid">' + cards + '</section><section id="workspace" class="workspace-panel"></section><section class="approval-panel"><div><span class="eyebrow">PUBLISHING POLICY</span><h3>Approval required</h3><p>AI may inspect files and prepare suggestions. It cannot publish to GitHub without your explicit approval.</p></div><div class="lock-icon">⌑</div></section><footer>Signed in as <b>' + esc(user.email) + '</b> · Doodle Outpost AI Agent</footer></main></div>';
  document.querySelector("#logoutBtn").addEventListener("click", () => signOut(auth));
  document.querySelectorAll("[data-open]").forEach(button => button.addEventListener("click", event => {
    event.preventDefault();
    const id = button.dataset.open;
    document.querySelectorAll(".sidebar nav a").forEach(link => link.classList.toggle("active", link.dataset.open === id));
    if (openers[id]) openers[id]();
    document.querySelector("#workspace").scrollIntoView({ behavior: "smooth", block: "start" });
  }));
  document.querySelector("#chatForm").addEventListener("submit", async event => {
    event.preventDefault();
    const input = document.querySelector("#chatInput");
    const button = document.querySelector("#sendChat");
    const error = document.querySelector("#chatError");
    const message = input.value.trim(); if (!message) return;
    appendChatMessage("user", message); input.value = ""; error.textContent = "";
    button.disabled = true; button.textContent = "Thinking…";
    try {
      const result = await api("/api/agent/chat", { method: "POST", body: JSON.stringify({ message }) });
      appendChatMessage("assistant", result.answer || "The AI returned an empty response.");
    } catch (err) { error.textContent = err.message || "Could not reach the AI service."; }
    finally { button.disabled = false; button.textContent = "Send message →"; input.focus(); }
  });
}
onAuthStateChanged(auth, async user => {
  if (!user) { renderLogin(); return; }
  if ((user.email || "").toLowerCase() !== ADMIN_EMAIL) { await signOut(auth); renderLogin("This account is not authorized."); return; }
  if (!user.emailVerified) {
    try { await sendEmailVerification(user); await signOut(auth); renderLogin("A verification link was sent to your admin email. Verify it, then sign in again."); }
    catch { await signOut(auth); renderLogin("Email verification is required. Check Firebase email settings and try again."); }
    return;
  }
  renderDashboard(user);
});
renderLogin();
