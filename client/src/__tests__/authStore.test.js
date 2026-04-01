import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock axios
vi.mock('../services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('Auth Store', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  test('login sets tokens in localStorage', async () => {
    const { default: api } = await import('../services/api');
    api.post.mockResolvedValue({
      data: {
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        user: { id: '1', name: 'Test', email: 'test@test.com', role: 'employee' },
      },
    });

    const { default: useAuthStore } = await import('../store/authStore');
    const store = useAuthStore.getState();
    await store.login('test@test.com', 'pass');

    expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', 'test-token');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', 'test-refresh');
  });

  test('logout clears tokens', async () => {
    const { default: useAuthStore } = await import('../store/authStore');
    const store = useAuthStore.getState();
    store.logout();

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
  });

  test('register sets tokens', async () => {
    const { default: api } = await import('../services/api');
    api.post.mockResolvedValue({
      data: {
        accessToken: 'new-token',
        refreshToken: 'new-refresh',
        user: { id: '2', name: 'New', email: 'new@test.com', role: 'employee' },
      },
    });

    const { default: useAuthStore } = await import('../store/authStore');
    const store = useAuthStore.getState();
    await store.register({ name: 'New', email: 'new@test.com', password: 'pass' });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', 'new-token');
  });
});
