const API_URL = import.meta.env.VITE_API_URL; // e.g. https://.../api/tasks

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.error) message = body.error; // e.g. "A task titled ... already exists"
    } catch {
      // response had no JSON body
    }
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const taskApi = {
  list: ({ search = '', priority = '', size = 100 } = {}) => {
    const params = new URLSearchParams({ size });
    if (search.trim()) params.set('search', search.trim());
    if (priority) params.set('priority', priority);
    return request(`${API_URL}?${params}`); // { content, page, size, totalElements }
  },
  summary: () => request(`${API_URL}/summary`),
  create: (task) => request(API_URL, { method: 'POST', body: JSON.stringify(task) }),
  update: (id, changes) =>
    request(`${API_URL}/${id}`, { method: 'PUT', body: JSON.stringify(changes) }),
  remove: (id) => request(`${API_URL}/${id}`, { method: 'DELETE' }),
  rollover: () => request(`${API_URL}/rollover`, { method: 'POST' }),
};