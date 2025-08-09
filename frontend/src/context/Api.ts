// Centralized API utility for backend calls
const API_URL = 'http://localhost:3000';


export async function apiRequest(path, options = {}) {
  // Use the correct token from localStorage (minesToken)
  const token = localStorage.getItem('minesToken');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: token } : {}),
    ...options.headers,
  };
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });
  let data;
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
    // If not JSON, throw a more helpful error
    throw new Error('Unexpected response from server: ' + data);
  }
  if (!res.ok) throw new Error(data.error || 'API error');
  return data;
}

export default API_URL;
