import AsyncStorage from '@react-native-async-storage/async-storage';

export const setToken = async (accessToken, refreshToken) => {
  await AsyncStorage.setItem('accessToken', accessToken);
  if (refreshToken) await AsyncStorage.setItem('refreshToken', refreshToken);
};

export const getToken = async () => {
  return AsyncStorage.getItem('accessToken');
};

export const getRefreshToken = async () => {
  return AsyncStorage.getItem('refreshToken');
};

export const clearTokens = async () => {
  await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
};

export const setUser = async (user) => {
  await AsyncStorage.setItem('user', JSON.stringify(user));
};

export const getUser = async () => {
  const data = await AsyncStorage.getItem('user');
  return data ? JSON.parse(data) : null;
};

// Offline queue for failed requests
const QUEUE_KEY = 'offlineQueue';

export const addToQueue = async (request) => {
  const queue = JSON.parse(await AsyncStorage.getItem(QUEUE_KEY) || '[]');
  queue.push({ ...request, timestamp: Date.now() });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

export const getQueue = async () => {
  return JSON.parse(await AsyncStorage.getItem(QUEUE_KEY) || '[]');
};

export const clearQueue = async () => {
  await AsyncStorage.removeItem(QUEUE_KEY);
};
