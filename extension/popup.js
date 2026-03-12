const API_BASE = "http://localhost:8000/api";

document.addEventListener("DOMContentLoaded", async () => {
  const textArea = document.getElementById("selected-text");
  const noteInput = document.getElementById("note");
  const tagsInput = document.getElementById("tags");
  const saveBtn = document.getElementById("save-btn");
  const statusEl = document.getElementById("status");

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

  saveBtn.addEventListener("click", async () => {
    const selectedText = textArea.value.trim();
    if (!selectedText) {
      statusEl.textContent = "Please select or paste some text.";
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
        tags: tagsInput.value
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };

      const response = await fetch(`${API_BASE}/passages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      loadRecent();
    } catch (err) {
      statusEl.textContent = `Error: ${err.message}`;
      saveBtn.textContent = "Save Passage";
      saveBtn.disabled = false;
    }
  });

  loadRecent();
});

async function loadRecent() {
  try {
    const response = await fetch(`${API_BASE}/passages?limit=3`);
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
