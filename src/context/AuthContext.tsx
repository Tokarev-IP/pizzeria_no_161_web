import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser, signInAnonymous, onAuthStateChange, sendPhoneOTP, verifyPhoneOTP, initializeRecaptcha } from '../firebase/FirebaseAuth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
  sendPhoneOTP: (phoneNumber: string, recaptchaContainerId?: string) => Promise<string>;
  verifyPhoneOTP: (otp: string) => Promise<AuthUser>;
  initializeRecaptcha: (containerId?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const signInAnonymously = async () => {
    try {
      console.log('🔐 Starting anonymous sign in...');
      setLoading(true);
      setError(null);
      await signInAnonymous();
      console.log('✅ Anonymous sign in successful');
      // The user state will be updated by the auth state listener
    } catch (err: any) {
      console.error('❌ Anonymous sign in failed:', err);
      setError(err.message || 'Failed to sign in anonymously');
      setLoading(false);
    }
  };

  // Listen to authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      console.log('🔄 Auth state changed:', user ? {
        uid: user.uid,
        isAnonymous: user.isAnonymous,
        email: user.email
      } : 'No user');
      setUser(user);
      setLoading(false);
      setError(null);
    });

    return () => unsubscribe();
  }, []);

  // Auto sign in anonymously if no user is authenticated after initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading && !user && !error) {
        signInAnonymously();
      }
    }, 1000); // Small delay to ensure auth state is fully initialized

    return () => clearTimeout(timer);
  }, [loading, user, error, signInAnonymously]);

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      const { signOutUser } = await import('../firebase/FirebaseAuth');
      await signOutUser();
      // The user state will be updated by the auth state listener
    } catch (err: any) {
      setError(err.message || 'Failed to sign out');
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signInAnonymously,
    signOut,
    sendPhoneOTP,
    verifyPhoneOTP,
    initializeRecaptcha,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
