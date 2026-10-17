/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  User as FirebaseUser
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "@/firebase-applet-config.json";

// Singleton Firebase App initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

// Google OAuth Provider with account chooser parameter
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account"
});

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Initiates Google Single Sign-On using a popup window
 */
export const loginWithGooglePopup = async (): Promise<FirebaseUser> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("[FirebaseAuth] Popup Sign-in Error:", error);
    throw error;
  }
};

/**
 * Initiates Google Single Sign-On via full page redirect
 * Recommended for mobile browsers, webviews, and environments with popup blockers
 */
export const loginWithGoogleRedirect = async (): Promise<void> => {
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    console.error("[FirebaseAuth] Redirect Sign-in Error:", error);
    throw error;
  }
};

/**
 * Retrieves the result of a Google sign-in redirect flow if one was pending
 */
export const getGoogleRedirectResult = async (): Promise<FirebaseUser | null> => {
  try {
    const result = await getRedirectResult(auth);
    return result?.user || null;
  } catch (error) {
    console.error("[FirebaseAuth] Redirect Result Error:", error);
    throw error;
  }
};

// Default export for backward compatibility
export const loginWithGoogle = loginWithGooglePopup;
