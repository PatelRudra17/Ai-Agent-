import { create } from 'zustand';

const useThemeStore = create((set) => ({
  dark: localStorage.getItem('theme') !== 'light',
  toggle: () =>
    set((state) => {
      const next = !state.dark;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
      return { dark: next };
    }),
}));

// Init on load
const saved = localStorage.getItem('theme');
document.documentElement.setAttribute('data-theme', saved === 'light' ? 'light' : 'dark');

export default useThemeStore;
