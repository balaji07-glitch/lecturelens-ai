import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { auth, onAuthStateChanged, signInWithGoogle, signOutUser, syncUserProfile } from '../lib/firebase.ts';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signIn: () => Promise<User>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  signIn: async () => { throw new Error('Not implemented'); },
  signOut: async () => {},
  isAuthenticated: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await syncUserProfile(user);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    const user = await signInWithGoogle();
    setCurrentUser(user);
    return user;
  };

  const signOut = async () => {
    await signOutUser();
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        signIn,
        signOut,
        isAuthenticated: !!currentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
