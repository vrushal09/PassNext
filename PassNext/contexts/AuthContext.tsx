import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../config/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  initialized: false,
  logout: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    console.log('Setting up Firebase Auth listener...');
    
    // Set initial loading state
    setLoading(true);
    setInitialized(false);
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? `User logged in: ${user.uid}` : 'User logged out');
      setUser(user);
      setLoading(false);
      setInitialized(true);
    }, (error) => {
      console.error('Auth state change error:', error);
      setLoading(false);
      setInitialized(true);
    });

    // Give Firebase a moment to check for persisted auth state
    const timeout = setTimeout(() => {
      if (!initialized) {
        console.log('Auth initialization timeout - assuming no persisted user');
        setLoading(false);
        setInitialized(true);
      }
    }, 3000); // Wait up to 3 seconds for auth state to be determined

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, initialized, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
