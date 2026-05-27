import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState } from '../types';

interface AuthStore extends AuthState {
  profilePhoto: string | null;
  login: (data: { access_token: string; athlete_id: number; firstname: string | null; lastname: string | null; profilePhoto?: string | null }) => void;
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
      profilePhoto: null,

      login: ({ access_token, athlete_id, firstname, lastname, profilePhoto = null }) => {
        localStorage.setItem('access_token', access_token);
        set({ accessToken: access_token, athleteId: athlete_id, firstname, lastname, profilePhoto });
      },

      logout: () => {
        localStorage.removeItem('access_token');
        set({ accessToken: null, athleteId: null, firstname: null, lastname: null, profilePhoto: null });
      },

      isAuthenticated: () => !!get().accessToken,
    }),
    { name: 'auth-storage' }
  )
);
