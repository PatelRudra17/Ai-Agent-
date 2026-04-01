import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });

      // 2FA required — return without setting auth
      if (data.requires2FA) {
        set({ isLoading: false });
        return data;
      }

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      // Normalize id
      const user = { ...data.user, id: data.user.id || data.user._id };
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true, isLoading: false });
      return data;
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  validate2FA: async (tempToken, code) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/2fa/validate', { tempToken, code });
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      const user = { ...data.user, id: data.user.id || data.user._id };
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true, isLoading: false });
      return data;
    } catch (error) {
      const msg = error.response?.data?.message || '2FA validation failed';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/register', userData);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      const user = { ...data.user, id: data.user.id || data.user._id };
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true, isLoading: false });
      return data;
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  fetchUser: async () => {
    try {
      const { data } = await api.get('/auth/me');
      const u = data.user;
      if (u._id && !u.id) u.id = u._id;
      localStorage.setItem('user', JSON.stringify(u));
      set({ user: u, isAuthenticated: true });
    } catch {
      // Don't logout on fetch fail — keep cached user
      const cached = get().user;
      if (!cached) {
        set({ user: null, isAuthenticated: false });
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    }
  },

  logout: () => {
    try { api.post('/auth/logout').catch(() => {}); } catch {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
