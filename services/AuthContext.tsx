import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

/**
 * Authentication error types
 */
export enum AuthErrorType {
  POPUP_BLOCKED = 'POPUP_BLOCKED',
  POPUP_CLOSED = 'POPUP_CLOSED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
  errorType: AuthErrorType | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Classifies Firebase Auth errors into user-friendly categories
 */
const classifyAuthError = (error: any): { type: AuthErrorType; message: string } => {
  const code = error?.code || '';
  const message = error?.message || '';
  
  // Popup blocked by browser
  if (code === 'auth/popup-blocked' || message.includes('popup')) {
    return {
      type: AuthErrorType.POPUP_BLOCKED,
      message: 'Sign-in popup was blocked by your browser. Please allow popups for this site and try again.'
    };
  }
  
  // User closed popup
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return {
      type: AuthErrorType.POPUP_CLOSED,
      message: 'Sign-in was cancelled. Please try again when you\'re ready.'
    };
  }
  
  // Network errors
  if (code === 'auth/network-request-failed' || message.includes('network')) {
    return {
      type: AuthErrorType.NETWORK_ERROR,
      message: 'Network error. Please check your internet connection and try again.'
    };
  }
  
  // Unauthorized domain
  if (code === 'auth/unauthorized-domain') {
    return {
      type: AuthErrorType.UNKNOWN_ERROR,
      message: 'This domain is not authorized for authentication. Please contact support.'
    };
  }
  
  // Generic fallback
  return {
    type: AuthErrorType.UNKNOWN_ERROR,
    message: error?.message || 'Failed to sign in. Please try again.'
  };
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<AuthErrorType | null>(null);

  useEffect(() => {
    // Listen for auth state changes (handles token refresh automatically)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    }, (error) => {
      // Handle auth state change errors (e.g., token expiration)
      console.error('Auth state change error:', error);
      const { type, message } = classifyAuthError(error);
      setError(message);
      setErrorType(type);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async () => {
    try {
      setError(null);
      setErrorType(null);
      await signInWithPopup(auth, googleProvider);
      // Success - user state will be updated via onAuthStateChanged
    } catch (err: any) {
      const { type, message } = classifyAuthError(err);
      setError(message);
      setErrorType(type);
      console.error('Sign in failed:', err);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      setErrorType(null);
      await firebaseSignOut(auth);
      // Success - user state will be updated via onAuthStateChanged
    } catch (err: any) {
      const { type, message } = classifyAuthError(err);
      setError(message);
      setErrorType(type);
      console.error('Sign out failed:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, error, errorType }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
