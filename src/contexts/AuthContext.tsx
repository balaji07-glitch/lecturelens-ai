import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { auth, onAuthStateChanged, signInWithGoogle, signOutUser, syncUserProfile } from '../lib/firebase.ts';

export interface AppUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL?: string | null;
}

interface AuthContextType {
  currentUser: AppUser | User | null;
  loading: boolean;
  signIn: () => Promise<User | AppUser>;
  signInWithEmailOrGuest: (name?: string, email?: string) => AppUser;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  signIn: async () => { throw new Error('Not implemented'); },
  signInWithEmailOrGuest: () => ({ uid: 'guest-1', displayName: 'Student', email: 'user@example.com' }),
  signOut: async () => {},
  isAuthenticated: false,
});

const STORAGE_KEY = 'lecturelens_active_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              uid: user.uid,
              displayName: user.displayName,
              email: user.email,
              photoURL: user.photoURL,
            })
          );
          await syncUserProfile(user);
        } catch (e) {
          console.warn('Sync profile warning:', e);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    const user = await signInWithGoogle();
    setCurrentUser(user);
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        })
      );
    } catch {}
    return user;
  };

  const signInWithEmailOrGuest = (name?: string, email?: string): AppUser => {
    const appUser: AppUser = {
      uid: 'user-' + Date.now(),
      displayName: name?.trim() || 'Authenticated Scholar',
      email: email?.trim() || 'student@lecturelens.ai',
      photoURL: null,
    };
    setCurrentUser(appUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appUser));
    } catch {}
    return appUser;
  };

  const signOut = async () => {
    try {
      await signOutUser();
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
    setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        signIn,
        signInWithEmailOrGuest,
        signOut,
        isAuthenticated: !!currentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

