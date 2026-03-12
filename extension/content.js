// Content script: detects text selection and shows a "Save to Passages" button

let saveButton = null;

function createSaveButton() {
  const btn = document.createElement("div");
  btn.id = "passages-save-btn";
  btn.textContent = "Save to Passages";
  btn.style.display = "none";
  document.body.appendChild(btn);
  return btn;
}

function getSelectedText() {
  return window.getSelection().toString().trim();
}

function getPageMetadata() {
  const getMeta = (selectors) => {
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) return el.getAttribute("content") || el.textContent;
    }
    return null;
  };

  return {
    source_url: window.location.href,
    source_title:
      getMeta(['meta[property="og:title"]']) || document.title || null,
    author_name: getMeta([
      'meta[name="author"]',
      'meta[property="article:author"]',
      'meta[name="twitter:creator"]',
    ]),
  };
}

document.addEventListener("mouseup", (e) => {
  const text = getSelectedText();
  if (!text || text.length < 10) {
    if (saveButton) saveButton.style.display = "none";
    return;
  }

  if (!saveButton) {
    saveButton = createSaveButton();
  }

  // Position near the selection
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  saveButton.style.display = "block";
  saveButton.style.top = `${window.scrollY + rect.bottom + 8}px`;
  saveButton.style.left = `${window.scrollX + rect.left}px`;
});

document.addEventListener("mousedown", (e) => {
  if (saveButton && e.target !== saveButton) {
    saveButton.style.display = "none";
  }
});

document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "passages-save-btn") {
    e.preventDefault();
    e.stopPropagation();

    const selectedText = getSelectedText();
    if (!selectedText) return;

    const metadata = getPageMetadata();

    // Send to background script for saving
    chrome.runtime.sendMessage(
      {
        action: "savePassage",
        data: {
          selected_text: selectedText,
          ...metadata,
        },
      },
      (response) => {
        if (response && response.success) {
          saveButton.textContent = "Saved!";
          saveButton.classList.add("saved");
          setTimeout(() => {
            saveButton.style.display = "none";
            saveButton.textContent = "Save to Passages";
            saveButton.classList.remove("saved");
          }, 1500);
        } else {
          saveButton.textContent = "Error — try again";
          setTimeout(() => {
            saveButton.textContent = "Save to Passages";
          }, 2000);
        }
      }
    );
  }
});
