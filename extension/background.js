// Background service worker: handles API communication

const API_BASE = "http://localhost:8000/api";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "savePassage") {
    handleSavePassage(message.data)
      .then((result) => sendResponse({ success: true, data: result }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

async function handleSavePassage(data) {
  const stored = await chrome.storage.local.get(["token"]);
  if (!stored.token) {
    throw new Error("Not authenticated. Open the extension popup to sign in.");
  }

  const response = await fetch(`${API_BASE}/passages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${stored.token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}
