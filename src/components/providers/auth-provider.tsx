'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { signIn as amplifySignIn, signUp as amplifySignUp, signOut as amplifySignOut, getCurrentUser, fetchUserAttributes, confirmSignUp as amplifyConfirmSignUp, resendSignUpCode, resetPassword, confirmResetPassword } from 'aws-amplify/auth';
import '../../config/cognito'; // Initialize Cognito

interface User {
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  attributes: any;
  // Add missing properties for app compatibility
  role: string;
  isApproved: boolean;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (username: string, password: string) => Promise<any>;
  signUp: (username: string, password: string, email: string, firstName?: string, lastName?: string) => Promise<any>;
  signOut: () => Promise<void>;
  confirmSignUp: (username: string, code: string) => Promise<any>;
  resendConfirmationCode: (username: string) => Promise<any>;
  forgotPassword: (username: string) => Promise<any>;
  forgotPasswordSubmit: (username: string, code: string, newPassword: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      setIsLoading(true);
      console.log('Checking auth state...');
      const currentUser = await getCurrentUser();
      console.log('Current user:', currentUser);
      const userAttributes = await fetchUserAttributes();
      console.log('User attributes:', userAttributes);
      
      const formattedUser: User = {
        username: currentUser.username,
        email: userAttributes.email || '',
        firstName: userAttributes.given_name,
        lastName: userAttributes.family_name,
        attributes: userAttributes,
        // Add default properties for app compatibility
        name: userAttributes.name || `${userAttributes.given_name || ''} ${userAttributes.family_name || ''}`.trim() || userAttributes.email || currentUser.username,
        role: userAttributes['custom:role'] || 'student', // Default to student role
        isApproved: true // Cognito users are considered approved by default
      };
      
      console.log('Formatted user:', formattedUser);
      setUser(formattedUser);
    } catch (error) {
      console.log('No authenticated user found:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const result = await amplifySignIn({ username, password });
      await checkAuthState();
      return result;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const signUp = async (username: string, password: string, email: string, firstName?: string, lastName?: string) => {
    try {
      const userAttributes: any = {
        email,
      };
      
      if (firstName) userAttributes.given_name = firstName;
      if (lastName) userAttributes.family_name = lastName;

      const result = await amplifySignUp({
        username,
        password,
        options: {
          userAttributes
        }
      });
      
      return result;
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await amplifySignOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const confirmSignUp = async (username: string, code: string) => {
    try {
      const result = await amplifyConfirmSignUp({ username, confirmationCode: code });
      return result;
    } catch (error) {
      throw error;
    }
  };

  const resendConfirmationCode = async (username: string) => {
    try {
      const result = await resendSignUpCode({ username });
      return result;
    } catch (error) {
      throw error;
    }
  };

  const forgotPassword = async (username: string) => {
    try {
      const result = await resetPassword({ username });
      return result;
    } catch (error) {
      throw error;
    }
  };

  const forgotPasswordSubmit = async (username: string, code: string, newPassword: string) => {
    try {
      const result = await confirmResetPassword({ username, confirmationCode: code, newPassword });
      return result;
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    confirmSignUp,
    resendConfirmationCode,
    forgotPassword,
    forgotPasswordSubmit,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
