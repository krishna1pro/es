/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Sensitive query parameters that should NEVER leak into browser URL or history
// (e.g., accidental GET form submissions, passwords, or direct link leaks)
const SENSITIVE_LEAK_PARAMS = new Set([
  "email",
  "mail",
  "user_email",
  "user",
  "password",
  "secret",
  "apikey",
  "api_key"
]);

// OAuth in-flight callback parameters that the authentication library MUST read
// before they are removed from the browser URL.
const OAUTH_CALLBACK_PARAMS = new Set([
  "code",
  "state",
  "session_state",
  "authuser",
  "prompt"
]);

export interface SanitizeOptions {
  /**
   * If true, OAuth parameters (code, state) will NOT be removed,
   * allowing Firebase getRedirectResult to process them first.
   * Default: true
   */
  preserveOAuthParams?: boolean;
}

/**
 * Sanitizes the current browser URL by stripping sensitive parameters.
 * Preserves OAuth callback parameters (code, state) by default until the
 * authentication library has completed reading them.
 * Uses window.history.replaceState to avoid polluting browser history or reloading.
 */
export function sanitizeCurrentUrl(options: SanitizeOptions = { preserveOAuthParams: true }): boolean {
  if (typeof window === "undefined") return false;

  const preserveOAuth = options.preserveOAuthParams !== false;
  let modified = false;
  const url = new URL(window.location.href);

  const keysToDelete: string[] = [];
  url.searchParams.forEach((_val, key) => {
    const lowerKey = key.toLowerCase();
    // Always delete sensitive leak parameters (email, password, etc.)
    if (SENSITIVE_LEAK_PARAMS.has(lowerKey)) {
      keysToDelete.push(key);
    }
    // Delete OAuth params only when NOT preserving them (i.e. after auth has completed)
    else if (!preserveOAuth && OAUTH_CALLBACK_PARAMS.has(lowerKey)) {
      keysToDelete.push(key);
    }
  });

  if (keysToDelete.length > 0) {
    keysToDelete.forEach((key) => url.searchParams.delete(key));
    modified = true;
  }

  // Check hash for leaked tokens or emails outside of auth redirects
  if (url.hash && !preserveOAuth && (url.hash.includes("token=") || url.hash.includes("email="))) {
    url.hash = "";
    modified = true;
  }

  if (modified) {
    const cleanUrl = url.pathname + (url.search ? url.search : "") + (url.hash ? url.hash : "");
    window.history.replaceState(null, document.title, cleanUrl);
    return true;
  }

  return false;
}

/**
 * Safely removes OAuth callback parameters (code, state) after
 * Firebase getRedirectResult has finished processing them.
 */
export function cleanupOAuthCallbackParams(): boolean {
  return sanitizeCurrentUrl({ preserveOAuthParams: false });
}

/**
 * React hook to enforce URL cleanliness on navigation and initial mount.
 * Strips sensitive query params (email, password) while preserving OAuth in-flight params.
 */
export function useUrlSanitizer() {
  const location = useLocation();

  useEffect(() => {
    // Preserve OAuth parameters during routing so redirect auth can complete
    sanitizeCurrentUrl({ preserveOAuthParams: true });
  }, [location.pathname, location.search, location.hash]);
}
