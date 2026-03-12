const API_BASE = "/api";

export async function fetchPassages({ search, tag, author } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (tag) params.set("tag", tag);
  if (author) params.set("author", author);

  const url = `${API_BASE}/passages${params.toString() ? "?" + params : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchPassage(id) {
  const res = await fetch(`${API_BASE}/passages/${id}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function deletePassage(id) {
  const res = await fetch(`${API_BASE}/passages/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
}

export async function updatePassage(id, data) {
  const res = await fetch(`${API_BASE}/passages/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchTags() {
  const res = await fetch(`${API_BASE}/tags`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
