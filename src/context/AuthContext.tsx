import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';

interface AuthContextType {
  user: any;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isDesigner: boolean;
  isClient: boolean;
  loginAs: (role: 'admin' | 'designer' | 'client') => void;
  loginWithAPI: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedProfile = localStorage.getItem('piklab_user');
    const token = localStorage.getItem('piklab_token');
    
    if (savedProfile && token) {
      const data = JSON.parse(savedProfile);
      setProfile(data);
      setUser({ uid: data.uid, email: data.email });
    }
    setLoading(false);
  }, []);

  const loginWithAPI = async (username: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (!res.ok) throw new Error('Giriş başarısız');
    const data = await res.json();
    
    localStorage.setItem('piklab_token', data.token);
    localStorage.setItem('piklab_user', JSON.stringify(data.profile));
    
    setProfile(data.profile);
    setUser({ uid: data.profile.uid, email: data.profile.email });
  };

  const loginAs = (role: 'admin' | 'designer' | 'client') => {
    const mockProfile = {
      uid: role === 'admin' ? 'admin' : role === 'designer' ? 'designer_1' : 'client_1',
      displayName: role.charAt(0).toUpperCase() + role.slice(1),
      email: `${role}@piklab.com`,
      role: role,
    };
    localStorage.setItem('piklab_user', JSON.stringify(mockProfile));
    localStorage.setItem('piklab_token', 'mock_token');
    setProfile(mockProfile as any);
    setUser({ uid: mockProfile.uid, email: mockProfile.email });
  };

  const logout = () => {
    localStorage.removeItem('piklab_token');
    localStorage.removeItem('piklab_user');
    setUser(null);
    setProfile(null);
  };

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin' || profile?.uid === 'admin',
    isDesigner: profile?.role === 'designer' || profile?.role === 'admin' || profile?.uid === 'designer_1',
    isClient: profile?.role === 'client' || profile?.uid === 'client_1',
    loginAs,
    loginWithAPI,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
