const API_BASE = import.meta.env.VITE_API_URL;                 // https://.../api/tasks
const AUTH_BASE = API_BASE.replace(/\/tasks\/?$/, '/auth');    // https://.../api/auth

const TOKEN_KEY = 'taskflow_token';
const USER_KEY = 'taskflow_user';

export const session = {
  get() {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const user = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
      return token && user ? { token, user } : null;
    } catch {
      return null;
    }
  },
  save({ token, name, email }) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify({ name, email }));
    } catch {
      // storage unavailable
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      // storage unavailable
    }
  },
};

async function request(url, options = {}) {
  const token = session.get()?.token;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  // The saved token was rejected, so the user must log in again
  if (res.status === 401 && token) {
    session.clear();
    window.dispatchEvent(new Event('session-expired'));
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.error) message = body.error;
    } catch {
      // no JSON body
    }
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const authApi = {
  login: (credentials) =>
    request(`${AUTH_BASE}/login`, { method: 'POST', body: JSON.stringify(credentials) }),
  register: (data) =>
    request(`${AUTH_BASE}/register`, { method: 'POST', body: JSON.stringify(data) }),
};

export const taskApi = {
  list: ({ search = '', priority = '', size = 100 } = {}) => {
    const params = new URLSearchParams({ size });
    if (search.trim()) params.set('search', search.trim());
    if (priority) params.set('priority', priority);
    return request(`${API_BASE}?${params}`);
  },
  summary: () => request(`${API_BASE}/summary`),
  create: (task) => request(API_BASE, { method: 'POST', body: JSON.stringify(task) }),
  update: (id, changes) =>
    request(`${API_BASE}/${id}`, { method: 'PUT', body: JSON.stringify(changes) }),
  remove: (id) => request(`${API_BASE}/${id}`, { method: 'DELETE' }),
  rollover: () => request(`${API_BASE}/rollover`, { method: 'POST' }),
};