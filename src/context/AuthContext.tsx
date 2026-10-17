/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { auth, loginWithGoogle as firebaseLoginWithGoogle } from "@/src/db/firebase";
import { UserProfile, UserStatus, UserRole } from "../types";

interface AuthContextValue {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isApproved: boolean;
  loginWithGoogle: () => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<UserProfile | null>;
  getIdToken: () => Promise<string | null>;
  authFetch: (url: string, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getIdToken = useCallback(async (): Promise<string | null> => {
    if (!auth.currentUser) return null;
    try {
      return await auth.currentUser.getIdToken();
    } catch (err) {
      console.error("[AuthContext] Failed to get ID token:", err);
      return null;
    }
  }, []);

  const authFetch = useCallback(
    async (url: string, init: RequestInit = {}): Promise<Response> => {
      const token = await getIdToken();
      const headers = new Headers(init.headers || {});
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return fetch(url, { ...init, headers });
    },
    [getIdToken]
  );

  const syncUserWithBackend = useCallback(
    async (fbUser: FirebaseUser, requestedRole?: string, requestNotes?: string): Promise<UserProfile | null> => {
      try {
        const idToken = await fbUser.getIdToken();
        const res = await fetch("/api/auth/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`
          },
          body: JSON.stringify({
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL,
            requestedRole,
            requestNotes
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Sync error: ${res.status}`);
        }

        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          return data.user;
        }
        return null;
      } catch (err: any) {
        console.error("[AuthContext] Error syncing user with backend:", err);
        setError(err.message || "Failed to sync user with database");
        return null;
      }
    },
    []
  );

  const refreshUser = useCallback(async (): Promise<UserProfile | null> => {
    if (!auth.currentUser) {
      setUser(null);
      return null;
    }
    return syncUserWithBackend(auth.currentUser);
  }, [syncUserWithBackend]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentFirebaseUser) => {
      setFirebaseUser(currentFirebaseUser);
      if (currentFirebaseUser) {
        try {
          await syncUserWithBackend(currentFirebaseUser);
        } catch (err: any) {
          setError(err.message);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [syncUserWithBackend]);

  const handleLoginWithGoogle = async (): Promise<UserProfile | null> => {
    setLoading(true);
    setError(null);
    try {
      const fbUser = await firebaseLoginWithGoogle();
      if (!fbUser) throw new Error("No user returned from Google sign-in");
      setFirebaseUser(fbUser);
      const synced = await syncUserWithBackend(fbUser);
      return synced;
    } catch (err: any) {
      console.error("[AuthContext] Google sign-in failed:", err);
      setError(err.message || "Google sign-in failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
    } catch (err: any) {
      console.error("[AuthContext] Sign out error:", err);
    }
  };

  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const isApproved = user?.status === UserStatus.APPROVED;
  const isAdmin = isApproved && (isSuperAdmin || user?.role === UserRole.ADMIN || user?.role !== UserRole.VIEWER);

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        error,
        isSuperAdmin,
        isAdmin,
        isApproved,
        loginWithGoogle: handleLoginWithGoogle,
        logout: handleLogout,
        refreshUser,
        getIdToken,
        authFetch
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
