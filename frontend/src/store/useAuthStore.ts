import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState } from '../types';

interface AuthStore extends AuthState {
  login: (data: { access_token: string; athlete_id: number; firstname: string | null; lastname: string | null }) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      accessToken: null,
      athleteId: null,
      firstname: null,
      lastname: null,

      login: ({ access_token, athlete_id, firstname, lastname }) => {
        localStorage.setItem('access_token', access_token);
        set({ accessToken: access_token, athleteId: athlete_id, firstname, lastname });
      },

      logout: () => {
        localStorage.removeItem('access_token');
        set({ accessToken: null, athleteId: null, firstname: null, lastname: null });
      },

      isAuthenticated: () => !!get().accessToken,
    }),
    { name: 'auth-storage' }
  )
);
