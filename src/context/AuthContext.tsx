import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

export interface User {
    id: number;
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    picture?: string;
    merchant?: {
        id: number;
        merchantId: number;
        name?: string;
        [key: string]: any;
    };
    [key: string]: any;
}

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: User | null;
    login: (userName: string, password: string) => Promise<void>;
    loginWithGoogle: (credential: string, isAccessToken?: boolean) => Promise<void>;
    logout: () => void;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = authService.getToken();
        const userInfoStr = localStorage.getItem('user_info');

        if (token) {
            setIsAuthenticated(true);
            if (userInfoStr) {
                try {
                    setUser(JSON.parse(userInfoStr));
                } catch (e) {
                    console.error('Failed to parse user info', e);
                }
            }
        }
        setIsLoading(false);
    }, []);

    const login = useCallback(async (userName: string, password: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await authService.login(userName, password);

            // Extract merchant ID from the nested structure (merchants or user.merchant)
            const mId = response.merchant?.id || response.user?.merchant?.id;

            // Strict Merchant ID filtering: only allow merchantId 100
            if (Number(mId) !== 100) {
                authService.logout();
                throw new Error('Access Denied: Your account does not have authorization for this portal.');
            }

            setIsAuthenticated(true);
            if (response.user) {
                setUser(response.user as User);
                localStorage.setItem('user_info', JSON.stringify(response.user));
            }
        } catch (err: any) {
            let errorMessage = err.response?.data?.message || err.message || 'Login failed';

            // Humanize common technical errors
            if (errorMessage === 'Request failed with status code 400' || err.response?.status === 400) {
                errorMessage = 'Invalid username or password.';
            } else if (err.response?.status === 401) {
                errorMessage = 'Access denied. Please check your credentials.';
            }

            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loginWithGoogle = useCallback(async (credential: string, isAccessToken: boolean = false) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await authService.loginWithGoogle(credential, isAccessToken);

            // Note: Merchant ID check removed for Google Login as requested
            // We accept any valid Google user and assign them to a default context if needed

            setIsAuthenticated(true);
            if (response.user) {
                setUser(response.user as User);
            }
        } catch (err: any) {
            console.error('Google Login Error', err);
            setError(err.message || 'Google Sign-In failed');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        authService.logout();
        setIsAuthenticated(false);
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, loginWithGoogle, logout, error }}>
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
