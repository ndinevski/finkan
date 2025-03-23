import { db } from '../db/client';
import { Profile } from '../db/types';

export const auth = {
  async getSession() {
    // For now, we'll use a mock session
    // TODO: Implement proper session management
    const mockUserId = '00000000-0000-0000-0000-000000000001';
    const profile = await db.getProfile(mockUserId);
    return { data: { user: profile } };
  },

  async signIn(email: string, password: string) {
    // TODO: Implement proper authentication
    const mockUserId = '00000000-0000-0000-0000-000000000001';
    const profile = await db.getProfile(mockUserId);
    return { data: { user: profile } };
  },

  async signOut() {
    // TODO: Implement proper sign out
    return { data: { user: null } };
  }
}; 