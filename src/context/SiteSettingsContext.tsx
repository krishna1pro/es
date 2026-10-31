/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SiteSettingsDocument } from "../types/homeCms";
import { use10SecPublicPolling } from "../hooks/use10SecPublicPolling";

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

export function isPublicRoutePath(pathname: string): boolean {
  const p = pathname.toLowerCase();
  return !(
    p.startsWith("/admin") ||
    p.startsWith("/leadership-control-center") ||
    p.startsWith("/waiting-room") ||
    p === "/login" ||
    p === "/admin/login"
  );
}

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

  let locationPathname = "";
  try {
    const location = useLocation();
    locationPathname = location.pathname;
  } catch (e) {
    if (typeof window !== "undefined") {
      locationPathname = window.location.pathname;
    }
  }

  const fetchSettings = async (forceRefresh = false) => {
    try {
      if (!settings && !forceRefresh) setLoading(true);
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
      if (!settings) {
        setError(err.message || "Failed to load settings");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialSettings && (!settings || !cachedSiteSettings)) {
      fetchSettings(false);
    } else {
      setLoading(false);
    }
  }, []);

  const isPublicRoute = isPublicRoutePath(locationPathname);

  use10SecPublicPolling(async (isBackground) => {
    if (isBackground) {
      await fetchSettings(true);
    }
  }, isPublicRoute);

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
