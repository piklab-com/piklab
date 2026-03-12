import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, SiteSettings } from '../lib/api';

interface SiteSettingsContextType {
  settings: SiteSettings | null;
  loading: boolean;
  updateSettings: (newSettings: Partial<SiteSettings>) => Promise<void>;
  refresh: () => void;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setSettings(await api.getSettings());
    setLoading(false);
  };

  useEffect(() => {
    load();

    // Listen for changes from other tabs (like Admin Panel)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'piklab_settings') {
        load();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    await api.saveSettings(newSettings);
    await load();
  };

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, updateSettings, refresh: load }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext);
  if (context === undefined) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
};
