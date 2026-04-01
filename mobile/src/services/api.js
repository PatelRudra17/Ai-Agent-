import axios from 'axios';
import { getToken, getRefreshToken, setToken, clearTokens, addToQueue } from './storage';

// Change this to your server URL
const API_URL = 'http://10.0.2.2:5000/api'; // Android emulator → localhost
// const API_URL = 'http://localhost:5000/api'; // iOS simulator
// const API_URL = 'https://your-railway-app.up.railway.app/api'; // Production

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach token
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 → refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Offline — queue the request
    if (!error.response) {
      await addToQueue({
        method: original.method,
        url: original.url,
        data: original.data,
      });
      return Promise.reject(new Error('Offline — request queued'));
    }

    if (error.response.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          await setToken(data.accessToken, data.refreshToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch {
          await clearTokens();
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_URL };
