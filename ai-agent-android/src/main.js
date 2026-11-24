import "./style.css";
import { auth, ADMIN_EMAIL } from "./firebase.js";
import {
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";

const API_BASE = "https://doodle-outpost-ai-agent.onrender.com";
const app = document.querySelector("#app");

const modules = [
  ["scan-search", "Game Scanner", "Inspect game source files and configuration."],
  ["bug", "Bug Reports", "Collect, classify and track detected issues."],
  ["gamepad-2", "Testing Lab", "Run available automated gameplay tests."],
  ["code", "AI Developer", "Prepare code changes from your instructions."],
  ["github", "GitHub Manager", "Review proposed files and approved commits."],
  ["history", "Version Manager", "Track releases, backups and rollback points."]
];

function renderLogin(message = "") {
  app.innerHTML = `
    <main class="auth-shell">
      <section class="auth-card">
        <div class="brand-mark">DO<span>AI</span></div>
        <p class="eyebrow">PRIVATE DEVELOPER CONSOLE</p>
        <h1>Doodle Outpost<br>AI Agent</h1>
        <p class="muted">Sign in to your private game development workspace.</p>
        <form id="loginForm">
          <label>Email address<input id="email" type="email" autocomplete="username" placeholder="Admin email" required /></label>
          <label>Password<input id="password" type="password" autocomplete="current-password" placeholder="Your password" required /></label>
          <button class="primary" type="submit">Sign in <span>→</span></button>
          <p class="form-message" id="formMessage" role="alert">${message}</p>
        </form>
        <div class="secure-note"><span>●</span> Private admin access</div>
      </section>
    </main>`;

  document.querySelector("#loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = event.currentTarget.querySelector("button");
    const message = document.querySelector("#formMessage");
    const email = document.querySelector("#email").value.trim().toLowerCase();
    const password = document.querySelector("#password").value;
    if (email !== ADMIN_EMAIL) {
      message.textContent = "This account is not authorized for the developer console.";
      return;
    }
    button.disabled = true;
    button.textContent = "Signing in…";
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      message.textContent = error.code === "auth/invalid-credential"
        ? "Email or password is incorrect."
        : error.message;
      button.disabled = false;
      button.innerHTML = 'Sign in <span>→</span>';
    }
  });
}

function appendChatMessage(role, text) {
  const list = document.querySelector("#chatMessages");
  const item = document.createElement("div");
  item.className = `chat-message ${role}`;
  const label = document.createElement("strong");
  label.textContent = role === "user" ? "YOU" : "DO AI";
  const body = document.createElement("p");
  body.textContent = text;
  item.append(label, body);
  list.append(item);
  list.scrollTop = list.scrollHeight;
}

function renderDashboard(user) {
  app.innerHTML = `
    <div class="dashboard">
      <aside class="sidebar">
        <div class="side-brand"><div class="brand-mark small">DO<span>AI</span></div><div><b>DO AI AGENT</b><small>Developer console</small></div></div>
        <div class="side-label">WORKSPACE</div>
        <nav>
          <a class="active" href="#overview">▦ <span>Overview</span></a>
          <a href="#scanner">⌕ <span>Game Scanner</span></a>
          <a href="#bugs">⌁ <span>Bug Reports</span></a>
          <a href="#testing">▷ <span>Testing Lab</span></a>
          <a href="#developer">⌘ <span>AI Developer</span></a>
          <a href="#github">⑂ <span>GitHub Manager</span></a>
          <a href="#versions">◷ <span>Version History</span></a>
        </nav>
        <div class="sidebar-bottom"><span class="status-dot"></span> Admin session active</div>
      </aside>
      <main class="main-content">
        <header class="topbar"><div><span class="eyebrow">DOODLE OUTPOST / WORKSPACE</span><h1>Developer Dashboard</h1></div><button id="logoutBtn" class="ghost">Sign out ↗</button></header>
        <section class="welcome-panel"><div><p class="eyebrow">PRIVATE AI WORKSPACE</p><h2>Welcome back, Developer.</h2><p>Inspect your game, investigate issues and prepare improvements.</p></div><div class="orb">✳</div></section>
        <div class="section-heading"><div><h2>AI Developer Chat</h2><p>Ask your private assistant about Doodle Outpost.</p></div><span class="admin-chip">● ADMIN</span></div>
        <section class="chat-panel">
          <div class="chat-status"><span class="status-dot"></span> Connected to your secured AI backend</div>
          <div id="chatMessages" class="chat-messages" aria-live="polite">
            <div class="chat-message assistant"><strong>DO AI</strong><p>Hello! I'm your Doodle Outpost development assistant. I can answer questions and help plan code changes. I will not publish anything to GitHub without your approval.</p></div>
          </div>
          <form id="chatForm" class="chat-form">
            <textarea id="chatInput" rows="2" maxlength="12000" placeholder="Ask something about your game…" required></textarea>
            <button class="primary" id="sendChat" type="submit">Send message →</button>
          </form>
          <p id="chatError" class="chat-error" role="alert"></p>
        </section>
        <div class="section-heading"><div><h2>Development tools</h2><p>Additional workspaces will be connected in later phases.</p></div></div>
        <section class="module-grid">
          ${modules.map(([icon, title, description], index) => `
            <article class="module-card" data-module="${title}">
              <div class="module-icon">${["⌕","⌁","▷","⌘","⑂","◷"][index]}</div>
              <h3>${title}</h3><p>${description}</p><span class="card-arrow">Open workspace →</span>
            </article>`).join("")}
        </section>
        <section class="approval-panel"><div><span class="eyebrow">PUBLISHING POLICY</span><h3>Approval required</h3><p>The agent may prepare changes, but it must never publish to GitHub without your approval.</p></div><div class="lock-icon">⌑</div></section>
        <footer>Signed in as <b>${user.email}</b> · Doodle Outpost AI Agent</footer>
      </main>
    </div>`;

  document.querySelector("#logoutBtn").addEventListener("click", () => signOut(auth));
  document.querySelectorAll(".module-card").forEach(card => {
    card.addEventListener("click", () => {
      alert(card.dataset.module + " is planned for a later development phase. AI chat is connected; this module is not yet implemented.");
    });
  });

  document.querySelector("#chatForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = document.querySelector("#chatInput");
    const button = document.querySelector("#sendChat");
    const error = document.querySelector("#chatError");
    const message = input.value.trim();
    if (!message) return;
    appendChatMessage("user", message);
    input.value = "";
    error.textContent = "";
    button.disabled = true;
    button.textContent = "Thinking…";
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(`${API_BASE}/api/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ message })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
      appendChatMessage("assistant", data.answer || "The AI returned an empty response.");
    } catch (err) {
      error.textContent = err.message || "Could not reach the AI service. Please try again.";
    } finally {
      button.disabled = false;
      button.textContent = "Send message →";
      input.focus();
    }
  });
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    renderLogin();
    return;
  }
  if ((user.email || "").toLowerCase() !== ADMIN_EMAIL) {
    await signOut(auth);
    renderLogin("Access denied. This account is not authorized.");
    return;
  }
  if (!user.emailVerified) {
    try {
      await sendEmailVerification(user);
      await signOut(auth);
      renderLogin("A verification link was sent to your admin email. Verify it, then sign in again.");
    } catch {
      await signOut(auth);
      renderLogin("Email verification is required. Check Firebase email settings and try again.");
    }
    return;
  }
  renderDashboard(user);
});

renderLogin();
