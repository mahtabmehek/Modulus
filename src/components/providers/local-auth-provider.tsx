'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

// Types
interface LocalAuthUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    name: string;
    role: string;
    isVerified: boolean;
}

interface SignUpData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    accessCode: string;
}

interface LocalAuthContextType {
    user: LocalAuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (data: SignUpData) => Promise<void>;
    signOut: () => Promise<void>;
    getCurrentUser: () => Promise<LocalAuthUser | null>;
}

const LocalAuthContext = createContext<LocalAuthContextType | undefined>(undefined);

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Local storage keys
const TOKEN_KEY = 'modulus_token';
const USER_KEY = 'modulus_user';

export function LocalAuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<LocalAuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Initialize auth state from localStorage
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const token = localStorage.getItem(TOKEN_KEY);
                const userData = localStorage.getItem(USER_KEY);

                if (token && userData) {
                    const parsedUser = JSON.parse(userData);
                    
                    // Verify token is still valid
                    try {
                        const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        
                        setUser(response.data.user);
                        setIsAuthenticated(true);
                    } catch (error) {
                        // Token is invalid, clear storage
                        localStorage.removeItem(TOKEN_KEY);
                        localStorage.removeItem(USER_KEY);
                    }
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const signIn = async (email: string, password: string): Promise<void> => {
        try {
            setIsLoading(true);
            
            const response = await axios.post(`${API_BASE_URL}/auth/login`, {
                email,
                password
            });

            const { token, user: userData } = response.data;

            // Store token and user data
            localStorage.setItem(TOKEN_KEY, token);
            localStorage.setItem(USER_KEY, JSON.stringify(userData));

            // Format user data
            const formattedUser: LocalAuthUser = {
                id: userData.id.toString(),
                email: userData.email,
                firstName: userData.name.split(' ')[0] || '',
                lastName: userData.name.split(' ').slice(1).join(' ') || '',
                name: userData.name,
                role: userData.role,
                isVerified: userData.isApproved || false
            };

            setUser(formattedUser);
            setIsAuthenticated(true);
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Sign in failed';
            throw new Error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const signUp = async (data: SignUpData): Promise<void> => {
        try {
            setIsLoading(true);
            
            await axios.post(`${API_BASE_URL}/auth/register`, {
                email: data.email,
                password: data.password,
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role,
                accessCode: data.accessCode
            });

            // Don't auto-sign in after registration
            // User will need to sign in manually
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Sign up failed';
            throw new Error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const signOut = async (): Promise<void> => {
        try {
            setIsLoading(true);
            
            // Clear local storage
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            
            // Clear state
            setUser(null);
            setIsAuthenticated(false);
        } catch (error) {
            console.error('Sign out error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getCurrentUser = async (): Promise<LocalAuthUser | null> => {
        try {
            const token = localStorage.getItem(TOKEN_KEY);
            
            if (!token) {
                return null;
            }

            const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const userData = response.data.user;
            const formattedUser: LocalAuthUser = {
                id: userData.id.toString(),
                email: userData.email,
                firstName: userData.first_name,
                lastName: userData.last_name,
                name: `${userData.first_name} ${userData.last_name}`,
                role: userData.role,
                isVerified: userData.is_verified
            };

            setUser(formattedUser);
            setIsAuthenticated(true);
            return formattedUser;
        } catch (error) {
            console.error('Get current user error:', error);
            
            // Clear invalid token
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setUser(null);
            setIsAuthenticated(false);
            return null;
        }
    };

    const value: LocalAuthContextType = {
        user,
        isLoading,
        isAuthenticated,
        signIn,
        signUp,
        signOut,
        getCurrentUser
    };

    return (
        <LocalAuthContext.Provider value={value}>
            {children}
        </LocalAuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(LocalAuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within a LocalAuthProvider');
    }
    return context;
}
