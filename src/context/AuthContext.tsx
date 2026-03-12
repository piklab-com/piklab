import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isDesigner: boolean;
  isClient: boolean;
  loginAs: (role: 'admin' | 'designer' | 'client') => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load mock user from localStorage if it exists (for offline/dev mode)
  useEffect(() => {
    const mockUser = localStorage.getItem('piklab_mock_user');
    if (mockUser) {
      const data = JSON.parse(mockUser);
      setProfile(data);
      setUser({ uid: data.uid, email: data.email } as any);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              role: 'client',
              createdAt: new Date().toISOString()
            };
            try { await setDoc(doc(db, 'users', user.uid), newProfile); } catch(e) {}
            setProfile(newProfile);
          }
        } catch (error) {
          console.error('Auth error falling back to default:', error);
          setProfile({ uid: user.uid, role: 'client', displayName: 'Kullanıcı' } as any);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginAs = (role: 'admin' | 'designer' | 'client') => {
    const mockProfile = {
      uid: role === 'admin' ? 'admin' : role === 'designer' ? 'designer_1' : 'client_1',
      displayName: role.charAt(0).toUpperCase() + role.slice(1),
      email: `${role}@piklab.com`,
      role: role,
    };
    localStorage.setItem('piklab_mock_user', JSON.stringify(mockProfile));
    setProfile(mockProfile as any);
    setUser({ uid: mockProfile.uid, email: mockProfile.email } as any);
  };

  const logout = () => {
    localStorage.removeItem('piklab_mock_user');
    localStorage.removeItem('piklab_token');
    auth.signOut();
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
