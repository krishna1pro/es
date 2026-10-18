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

// In-memory cache for public site settings (5-minute TTL)
let cachedSiteSettings: SiteSettingsDocument | null = null;
let siteSettingsCacheTimestamp = 0;
const SETTINGS_CACHE_TTL = 5 * 60 * 1000;

export function SiteSettingsProvider({
  children,
  initialSettings
}: {
  children: React.ReactNode;
  initialSettings?: SiteSettingsDocument | null;
}) {
  const [settings, setSettingsState] = useState<SiteSettingsDocument | null>(
    initialSettings || cachedSiteSettings || null
  );
  const [loading, setLoading] = useState<boolean>(!initialSettings && !cachedSiteSettings);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async (forceRefresh = false) => {
    const now = Date.now();
    if (!forceRefresh && cachedSiteSettings && now - siteSettingsCacheTimestamp < SETTINGS_CACHE_TTL) {
      setSettingsState(cachedSiteSettings);
      setLoading(false);
      return;
    }

    try {
      if (!settings) setLoading(true);
      const res = await fetch("/api/public/site-settings");
      if (!res.ok) {
        throw new Error(`Failed to load site settings: ${res.statusText}`);
      }
      const data = await res.json();
      if (data && data.settings) {
        cachedSiteSettings = data.settings;
        siteSettingsCacheTimestamp = Date.now();
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
    if (!initialSettings && (!settings || !cachedSiteSettings)) {
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, []);

  const setSettings = (newSettings: SiteSettingsDocument) => {
    cachedSiteSettings = newSettings;
    siteSettingsCacheTimestamp = Date.now();
    setSettingsState(newSettings);
  };

  return (
    <SiteSettingsContext.Provider
      value={{
        settings,
        loading,
        error,
        setSettings,
        refreshSettings: () => fetchSettings(true)
      }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
}
