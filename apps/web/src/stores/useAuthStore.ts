import { create } from 'zustand';
import { api } from '../services/api.js';

export interface AuthUser {
  id: string;
  username: string;
  role: string;
  clearance: string;
  lastLoginAt?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkSession: () => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('sentinel_jwt'),
  isAuthenticated: !!localStorage.getItem('sentinel_jwt'),
  isLoading: false,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const { user, token } = await api.login({ username, password });
      localStorage.setItem('sentinel_jwt', token);
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return true;
    } catch (e: any) {
      set({
        error: e.message || 'Authentication failed',
        isLoading: false,
        isAuthenticated: false,
      });
      return false;
    }
  },

  logout: async () => {
    try {
      await api.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('sentinel_jwt');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
      });
    }
  },

  checkSession: async () => {
    const token = localStorage.getItem('sentinel_jwt');
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return false;
    }

    try {
      const { user } = await api.getSession();
      set({ user, isAuthenticated: true });
      return true;
    } catch {
      localStorage.removeItem('sentinel_jwt');
      set({ isAuthenticated: false, user: null, token: null });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
