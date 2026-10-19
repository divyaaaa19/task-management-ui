const API_URL = import.meta.env.VITE_API_URL;

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const taskApi = {
  getAll: () => request(API_URL),

  search: (title) =>
    request(`${API_URL}/search?title=${encodeURIComponent(title)}`),

  create: (task) =>
    request(API_URL, { method: 'POST', body: JSON.stringify(task) }),

  update: (id, changes) =>
    request(`${API_URL}/${id}`, { method: 'PUT', body: JSON.stringify(changes) }),

  remove: (id) =>
    request(`${API_URL}/${id}`, { method: 'DELETE' }),
};