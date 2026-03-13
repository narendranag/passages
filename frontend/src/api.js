const API_BASE = "/api";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { ...authHeaders(), ...options.headers },
  });
  if (res.status === 401) {
    // Try refresh
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        // Retry original request
        const retryRes = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${data.access_token}`,
          },
        });
        return retryRes;
      }
    }
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
  }
  return res;
}

// Auth
export async function register({ email, password, name }) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Registration failed");
  }
  return res.json();
}

export async function login({ email, password }) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Login failed");
  }
  return res.json();
}

// User
export async function fetchMe() {
  const res = await apiFetch(`${API_BASE}/me`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function updateMe(data) {
  const res = await apiFetch(`${API_BASE}/me`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// Passages (authenticated user's own)
export async function fetchPassages({ search, tag, author, visibility } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (tag) params.set("tag", tag);
  if (author) params.set("author", author);
  if (visibility) params.set("visibility", visibility);

  const url = `${API_BASE}/passages${params.toString() ? "?" + params : ""}`;
  const res = await apiFetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchPassage(id) {
  const res = await apiFetch(`${API_BASE}/passages/${id}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function deletePassage(id) {
  const res = await apiFetch(`${API_BASE}/passages/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
}

export async function updatePassage(id, data) {
  const res = await apiFetch(`${API_BASE}/passages/${id}`, {
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

// Public feed
export async function fetchFeed({ search, tag, page = 1 } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (tag) params.set("tag", tag);
  params.set("page", page);

  const res = await fetch(`${API_BASE}/feed?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// User profiles
export async function fetchUserPassages(userId, { tag, page = 1 } = {}) {
  const params = new URLSearchParams();
  if (tag) params.set("tag", tag);
  params.set("page", page);

  const res = await fetch(`${API_BASE}/users/${userId}/passages?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
