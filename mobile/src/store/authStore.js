import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  init: async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const userData = await AsyncStorage.getItem('user');
      if (token && userData) {
        set({ user: JSON.parse(userData), isAuthenticated: true, loading: false });
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    await AsyncStorage.setItem('accessToken', data.accessToken);
    await AsyncStorage.setItem('refreshToken', data.refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
    set({ user: data.user, isAuthenticated: true });
    return data;
  },

  register: async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    await AsyncStorage.setItem('accessToken', data.accessToken);
    await AsyncStorage.setItem('refreshToken', data.refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
    set({ user: data.user, isAuthenticated: true });
    return data;
  },

  logout: async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        await api.post('/auth/logout').catch(() => {});
      }
    } catch {}
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    set({ user: null, isAuthenticated: false });
  },

  fetchUser: async () => {
    try {
      const { data } = await api.get('/auth/me');
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      set({ user: data.user });
    } catch {}
  },
}));

export default useAuthStore;
