import { create } from 'zustand';

type ThemeMode = 'light' | 'dark';

interface UiState {
  isSidebarOpen: boolean;
  themeMode: ThemeMode;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const initialTheme =
  (localStorage.getItem('themeMode') as ThemeMode) || 'light';

export const useUiStore = create<UiState>((set) => ({
  isSidebarOpen: false,
  themeMode: initialTheme,
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.themeMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', newTheme);
      return { themeMode: newTheme };
    }),
  setTheme: (theme) => {
    localStorage.setItem('themeMode', theme);
    set({ themeMode: theme });
  },
}));
