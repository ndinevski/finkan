import { create } from 'zustand';
import { db } from '../db/client';
import { Profile } from '../db/types';
import { auth } from '../auth/client';

interface AuthState {
  user: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  handleMicrosoftRedirect: () => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: Profile | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  signIn: async (email: string, password: string) => {
    try {
      const { data } = await auth.signIn(email, password);
      if (data.user) {
        set({ user: data.user });
      }
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  },
  signUp: async (email: string, password: string) => {
    try {
      const { data } = await auth.signUp(email, password);
      if (data.user) {
        set({ user: data.user });
      }
    } catch (error) {
      console.error('Sign up failed:', error);
      throw error;
    }
  },
  signInWithMicrosoft: async () => {
    try {
      await auth.signInWithMicrosoft();


    } catch (error) {
      console.error('Microsoft sign in failed:', error);
      throw error;
    }
  },
  handleMicrosoftRedirect: async () => {
    try {
      set({ isLoading: true });
      console.log('Store: Handling Microsoft redirect');
      const { data } = await auth.handleMicrosoftRedirect();
      if (data && data.user) {
        console.log('Store: Microsoft authentication successful, user:', data.user);
        set({ user: data.user, isLoading: false });
      } else {
        console.error('Store: Microsoft authentication completed but no user data returned');
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Store: Microsoft redirect handling failed:', error);
      set({ isLoading: false });
      throw error; 
    }
  },
  signOut: async () => {
    try {
      await auth.signOut();
      set({ user: null });
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  },
  setUser: (user) => set({ user, isLoading: false }),
}));