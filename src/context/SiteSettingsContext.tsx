/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { SiteSettingsDocument } from "../types/homeCms";

interface SiteSettingsContextValue {
  settings: SiteSettingsDocument | null;
  loading: boolean;
  error: string | null;
  setSettings: (settings: SiteSettingsDocument) => void;
  refreshSettings: () => Promise<void>;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue>({
  settings: null,
  loading: true,
  error: null,
  setSettings: () => {},
  refreshSettings: async () => {}
});

export const useSiteSettings = () => useContext(SiteSettingsContext);

export function SiteSettingsProvider({
  children,
  initialSettings
}: {
  children: React.ReactNode;
  initialSettings?: SiteSettingsDocument | null;
}) {
  const [settings, setSettingsState] = useState<SiteSettingsDocument | null>(
    initialSettings || null
  );
  const [loading, setLoading] = useState<boolean>(!initialSettings);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/public/site-settings");
      if (!res.ok) {
        throw new Error(`Failed to load site settings: ${res.statusText}`);
      }
      const data = await res.json();
      if (data && data.settings) {
        setSettingsState(data.settings);
        setError(null);
      }
    } catch (err: any) {
      console.error("[SiteSettingsContext] Error fetching site settings:", err);
      setError(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialSettings && !settings) {
      fetchSettings();
    }
  }, []);

  const setSettings = (newSettings: SiteSettingsDocument) => {
    setSettingsState(newSettings);
  };

  return (
    <SiteSettingsContext.Provider
      value={{
        settings,
        loading,
        error,
        setSettings,
        refreshSettings: fetchSettings
      }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
}
