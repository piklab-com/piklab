import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';

const TOKEN_KEY = 'teras_token';
const USER_KEY  = 'teras_user';

interface AuthContextType {
  user: any;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isDesigner: boolean;
  isClient: boolean;
  loginWithAPI: (emailOrUsername: string, password: string) => Promise<void>;
  registerWithAPI: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser]       = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Persist session ────────────────────────────────────────────────
  useEffect(() => {
    const savedProfile = localStorage.getItem(USER_KEY);
    const token        = localStorage.getItem(TOKEN_KEY);
    if (savedProfile && token) {
      const data = JSON.parse(savedProfile);
      setProfile(data);
      setUser({ uid: data.uid, email: data.email });
    }
    setLoading(false);
  }, []);

  // ── Login ──────────────────────────────────────────────────────────
  const loginWithAPI = async (emailOrUsername: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // API accepts both `email` and `username` fields
      body: JSON.stringify({ email: emailOrUsername, username: emailOrUsername, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Giriş başarısız');
    }
    const data = await res.json();
    _setSession(data);
  };

  // ── Register ──────────────────────────────────────────────────────
  const registerWithAPI = async (name: string, email: string, password: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Kayıt başarısız');
    }
    const data = await res.json();
    _setSession(data);
  };

  // ── Helpers ────────────────────────────────────────────────────────
  const _setSession = (data: { token: string; profile: any }) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.profile));
    setProfile(data.profile);
    setUser({ uid: data.profile.uid, email: data.profile.email });
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Legacy keys cleanup
    localStorage.removeItem('piklab_token');
    localStorage.removeItem('piklab_user');
    setUser(null);
    setProfile(null);
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    isAdmin:    profile?.role === 'admin',
    isDesigner: profile?.role === 'designer',
    isClient:   profile?.role === 'client',
    loginWithAPI,
    registerWithAPI,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
