import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, confirmPassword?: string, acceptTerms?: boolean) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  savedPlantIds: Set<string>;
  toggleSavePlant: (plantId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('ayush_garden_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [savedPlantIds, setSavedPlantIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadCurrentUser() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const profile = await api.getProfile();
        setUser(profile);
        // Load saved plants
        try {
          const savedList = await api.getSavedPlants();
          const ids = new Set<string>(savedList.map((item: any) => item.plantId));
          setSavedPlantIds(ids);
        } catch (e) {
          console.warn('Could not load saved plants:', e);
        }
      } catch (err) {
        console.warn('Session expired or invalid token:', err);
        logout();
      } finally {
        setLoading(false);
      }
    }
    loadCurrentUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    localStorage.setItem('ayush_garden_token', res.token);
    setToken(res.token);
    setUser(res.user);
    // Fetch saved plants
    try {
      const savedList = await api.getSavedPlants();
      const ids = new Set<string>(savedList.map((item: any) => item.plantId));
      setSavedPlantIds(ids);
    } catch {}
  };

  const register = async (name: string, email: string, password: string, confirmPassword?: string, acceptTerms?: boolean) => {
    const res = await api.register({ name, email, password, confirmPassword, acceptTerms });
    localStorage.setItem('ayush_garden_token', res.token);
    setToken(res.token);
    setUser(res.user);
    setSavedPlantIds(new Set());
  };

  const demoLogin = async () => {
    await login('demo@ayushgarden.org', 'garden123');
  };

  const logout = () => {
    localStorage.removeItem('ayush_garden_token');
    setToken(null);
    setUser(null);
    setSavedPlantIds(new Set());
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const profile = await api.getProfile();
      setUser(profile);
      const savedList = await api.getSavedPlants();
      const ids = new Set<string>(savedList.map((item: any) => item.plantId));
      setSavedPlantIds(ids);
    } catch (e) {
      console.warn('Refresh error:', e);
    }
  };

  const toggleSavePlant = async (plantId: string): Promise<boolean> => {
    if (!user) {
      throw new Error('Please sign in to save plants to your collection.');
    }
    const isCurrentlySaved = savedPlantIds.has(plantId);
    if (isCurrentlySaved) {
      await api.removeSavedPlant(plantId);
      setSavedPlantIds((prev) => {
        const next = new Set(prev);
        next.delete(plantId);
        return next;
      });
      return false;
    } else {
      await api.savePlant(plantId);
      setSavedPlantIds((prev) => new Set([...prev, plantId]));
      return true;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        demoLogin,
        logout,
        refreshUser,
        savedPlantIds,
        toggleSavePlant
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
