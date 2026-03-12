// Background service worker: handles API communication

const API_BASE = "http://localhost:8000/api";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "savePassage") {
    savePassage(message.data)
      .then((result) => sendResponse({ success: true, data: result }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep message channel open for async response
  }
});

async function savePassage(data) {
  const response = await fetch(`${API_BASE}/passages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}
