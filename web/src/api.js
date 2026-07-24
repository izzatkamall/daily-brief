// Thin API client. Token is kept in localStorage so a refresh stays logged in.
// Base URL is relative in dev (Vite proxies /api). Override with VITE_API_BASE.
const BASE = import.meta.env.VITE_API_BASE ?? '';

let token = localStorage.getItem('token') || null;

export function getToken() {
  return token;
}

export function setToken(t) {
  token = t;
  if (t) localStorage.setItem('token', t);
  else localStorage.removeItem('token');
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    setToken(null);
    throw new Error('Unauthorized');
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  login: (username, password) =>
    request('/api/login', { method: 'POST', body: { username, password } }),
  listTasks: ({ status, priority } = {}) => {
    const qs = new URLSearchParams();
    if (status) qs.set('status', status);
    if (priority) qs.set('priority', priority);
    const q = qs.toString();
    return request(`/api/tasks${q ? `?${q}` : ''}`);
  },
  createTask: (task) => request('/api/tasks', { method: 'POST', body: task }),
  updateTask: (id, patch) => request(`/api/tasks/${id}`, { method: 'PUT', body: patch }),
  deleteTask: (id) => request(`/api/tasks/${id}`, { method: 'DELETE' }),
  brief: () => request('/api/brief', { method: 'POST' }),
};
