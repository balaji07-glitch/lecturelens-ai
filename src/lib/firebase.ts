import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Auth instance & Google Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore (use custom databaseId if configured)
export const db =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

// Connection test on initial boot per SKILL.md
async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or database ID needs configuration:', error.message);
    }
  }
}
testFirestoreConnection();

/**
 * Sign in with Google using popup, with fallback to redirect
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await syncUserProfile(result.user);
    return result.user;
  } catch (error: any) {
    // If popup was blocked or failed, attempt redirect
    if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/cancelled-popup-request') {
      await signInWithRedirect(auth, googleProvider);
      const redirectResult = await getRedirectResult(auth);
      if (redirectResult?.user) {
        await syncUserProfile(redirectResult.user);
        return redirectResult.user;
      }
    }
    throw error;
  }
}

/**
 * Sign out current user
 */
export async function signOutUser(): Promise<void> {
  await fbSignOut(auth);
}

/**
 * Sync user profile to Firestore
 */
export async function syncUserProfile(user: User): Promise<void> {
  if (!user) return;
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(
      userRef,
      {
        userId: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Student',
        photoURL: user.photoURL || '',
        role: 'student',
        lastLoginAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not sync user profile to Firestore:', err);
  }
}

export { onAuthStateChanged };
