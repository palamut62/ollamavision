import { create } from 'zustand';
import { User } from '../services/DatabaseService';

interface AppState {
  user: User | null;
  selectedModel: string;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setSelectedModel: (model: string) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  selectedModel: '',
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setSelectedModel: (model) => set({ selectedModel: model }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
