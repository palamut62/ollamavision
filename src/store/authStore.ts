import { create } from 'zustand';
import { databaseService } from '@/services/DatabaseService';
import type { User } from '@/services/DatabaseService';

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
  
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (username: string, email: string) => Promise<boolean>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoggedIn: false,
  isLoading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await databaseService.loginUser(username, password);
      if (user) {
        set({ user, isLoggedIn: true, error: null });
        return true;
      } else {
        set({ error: 'Invalid username or password' });
        return false;
      }
    } catch (error) {
      set({ error: 'An error occurred while signing in' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await databaseService.createUser(username, password);
      if (user) {
        set({ user, isLoggedIn: true, error: null });
        return true;
      } else {
        set({ error: 'Username is already taken' });
        return false;
      }
    } catch (error) {
      set({ error: 'An error occurred while signing up' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    set({ user: null, isLoggedIn: false });
  },

  updateProfile: async (username: string, email: string) => {
    const currentUser = get().user;
    if (!currentUser) return false;

    try {
      set({ isLoading: true, error: null });
      const updatedUser = await databaseService.updateProfile(currentUser.id, username, email);
      
      if (updatedUser) {
        set({ user: updatedUser });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update profile:', error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  updatePassword: async (currentPassword: string, newPassword: string) => {
    const currentUser = get().user;
    if (!currentUser) return false;

    try {
      set({ isLoading: true, error: null });
      const success = await databaseService.updatePassword(
        currentUser.id,
        currentPassword,
        newPassword
      );
      return success;
    } catch (error) {
      console.error('Failed to update password:', error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  }
})); 