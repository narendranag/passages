const API_BASE = "http://localhost:8000/api";

document.addEventListener("DOMContentLoaded", async () => {
  const loginView = document.getElementById("login-view");
  const formView = document.getElementById("form-view");
  const loginEmail = document.getElementById("login-email");
  const loginPassword = document.getElementById("login-password");
  const loginBtn = document.getElementById("login-btn");
  const loginStatus = document.getElementById("login-status");
  const logoutBtn = document.getElementById("logout-btn");
  const userNameEl = document.getElementById("user-name");

  const textArea = document.getElementById("selected-text");
  const noteInput = document.getElementById("note");
  const tagsInput = document.getElementById("tags");
  const saveBtn = document.getElementById("save-btn");
  const statusEl = document.getElementById("status");
  const privateToggle = document.getElementById("private-toggle");

  let isPrivate = false;

  // Check stored auth
  const stored = await chrome.storage.local.get(["token", "user"]);

  function showLogin() {
    loginView.style.display = "block";
    formView.style.display = "none";
  }

  function showForm(user) {
    loginView.style.display = "none";
    formView.style.display = "block";
    userNameEl.textContent = user.name || user.email;
  }

  if (stored.token && stored.user) {
    showForm(stored.user);
    loadUserSettings(stored.token);
  } else {
    showLogin();
  }

  // Login
  loginBtn.addEventListener("click", async () => {
    const email = loginEmail.value.trim();
    const password = loginPassword.value;
    if (!email || !password) {
      loginStatus.textContent = "Please enter email and password.";
      loginStatus.className = "status error";
      return;
    }
    loginBtn.disabled = true;
    loginBtn.textContent = "Signing in...";
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Login failed");
      }
      const data = await res.json();
      await chrome.storage.local.set({
        token: data.access_token,
        refresh_token: data.refresh_token,
        user: data.user,
      });
      showForm(data.user);
      loadUserSettings(data.access_token);
      loadRecent(data.access_token);
    } catch (err) {
      loginStatus.textContent = err.message;
      loginStatus.className = "status error";
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = "Sign in";
    }
  });

  // Logout
  logoutBtn.addEventListener("click", async () => {
    await chrome.storage.local.remove(["token", "refresh_token", "user"]);
    showLogin();
  });

  // Privacy toggle
  privateToggle.addEventListener("click", () => {
    isPrivate = !isPrivate;
    privateToggle.classList.toggle("active", isPrivate);
  });

  // Load user settings for default_private
  async function loadUserSettings(token) {
    try {
      const res = await fetch(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const profile = await res.json();
        isPrivate = profile.default_private;
        privateToggle.classList.toggle("active", isPrivate);
      }
    } catch {}
  }

  // Try to get selected text from the active tab
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab?.id) {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.getSelection().toString().trim(),
      });
      if (result?.result) {
        textArea.value = result.result;
      }
    }
  } catch (e) {
    // Ignore — user can paste manually
  }

  // Save
  saveBtn.addEventListener("click", async () => {
    const selectedText = textArea.value.trim();
    if (!selectedText) {
      statusEl.textContent = "Please select or paste some text.";
      return;
    }

    const auth = await chrome.storage.local.get(["token"]);
    if (!auth.token) {
      statusEl.textContent = "Please sign in first.";
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      const data = {
        selected_text: selectedText,
        source_url: tab?.url || "",
        source_title: tab?.title || "",
        note: noteInput.value.trim() || null,
        is_public: !isPrivate,
        tags: tagsInput.value
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };

      const response = await fetch(`${API_BASE}/passages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      saveBtn.textContent = "Saved!";
      saveBtn.classList.add("success");
      statusEl.textContent = "";

      setTimeout(() => {
        textArea.value = "";
        noteInput.value = "";
        tagsInput.value = "";
        saveBtn.textContent = "Save Passage";
        saveBtn.classList.remove("success");
        saveBtn.disabled = false;
      }, 1500);

      loadRecent(auth.token);
    } catch (err) {
      statusEl.textContent = `Error: ${err.message}`;
      saveBtn.textContent = "Save Passage";
      saveBtn.disabled = false;
    }
  });

  // Load recent on start if authenticated
  if (stored.token) {
    loadRecent(stored.token);
  }
});

async function loadRecent(token) {
  try {
    const response = await fetch(`${API_BASE}/passages?limit=3`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return;

    const passages = await response.json();
    if (passages.length === 0) return;

    const section = document.getElementById("recent-section");
    const list = document.getElementById("recent-list");
    section.style.display = "block";
    list.innerHTML = passages
      .map(
        (p) => `
      <div class="recent-item">
        ${truncate(p.selected_text, 100)}
        <div class="source">${p.source_title || p.source_url}</div>
      </div>
    `
      )
      .join("");
  } catch (e) {
    // API not running — that's fine
  }
}

function truncate(str, len) {
  if (!str) return "";
  const escaped = str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.length > len ? escaped.slice(0, len) + "..." : escaped;
}
