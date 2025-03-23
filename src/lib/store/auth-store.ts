import { create } from 'zustand';
import { db } from '../db/client';
import { Profile } from '../db/types';
import { auth } from '../auth/client';

interface AuthState {
  user: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: Profile | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  signIn: async (email: string, password: string) => {
    const { data } = await auth.signIn(email, password);
    if (data.user) {
      set({ user: data.user });
    }
  },
  signUp: async (email: string, password: string) => {
    // TODO: Implement proper user registration
    const { data } = await auth.signIn(email, password);
    if (data.user) {
      set({ user: data.user });
    }
  },
  signOut: async () => {
    await auth.signOut();
    set({ user: null });
  },
  setUser: (user) => set({ user, isLoading: false }),
}));