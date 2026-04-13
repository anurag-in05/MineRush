// Centralized API utility for backend calls
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');

export async function apiRequest(path: string, options: RequestInit = {}) {
  // Use the correct token from localStorage (minesToken)
  const token = localStorage.getItem('minesToken');
  const headers = new Headers(options.headers);

  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const requestOptions: RequestInit = {
    ...options,
    headers,
  };

  const res = await fetch(`${API_URL}${path}`, requestOptions);
  let data: unknown;
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  } else {
    const text = await res.text();
    // If not JSON, throw a more helpful error
    throw new Error('Unexpected response from server: ' + text);
  }

  if (!res.ok) {
    const errorMessage =
      typeof data === 'object' &&
      data !== null &&
      'error' in data &&
      typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : 'API error';

    throw new Error(errorMessage);
  }

  return data;
}

export default API_URL;
