import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './AuthGuard.css';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loading, error, signInAnonymously } = useAuth();

  // Automatically sign in anonymously if user is not authenticated
  useEffect(() => {
    if (!loading && !user && !error) {
      signInAnonymously();
    }
  }, [loading, user, error, signInAnonymously]);

  // Show loading spinner while checking authentication or signing in
  if (loading) {
    return (
      <div className="auth-loading-container">
        <div className="auth-loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Show error if authentication failed
  if (error) {
    return (
      <div className="auth-error-container">
        <div className="auth-error-icon">⚠️</div>
        <h3>Authentication Error</h3>
        <p>{error}</p>
        <button 
          className="auth-retry-button" 
          onClick={signInAnonymously}
        >
          Try Again
        </button>
      </div>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
};

export default AuthGuard;
