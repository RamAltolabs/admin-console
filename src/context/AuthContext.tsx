import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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

const TIMEOUT_DURATION = 20 * 60 * 1000; // 20 minutes in milliseconds

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // To properly handle cleanup of interval and event listeners
    const activityIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const logout = useCallback(() => {
        authService.logout();
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('last_activity');
    }, []);

    const checkSession = useCallback(() => {
        const lastActivity = localStorage.getItem('last_activity');
        if (lastActivity) {
            const timeSinceLastActivity = Date.now() - parseInt(lastActivity, 10);
            if (timeSinceLastActivity > TIMEOUT_DURATION) {
                console.log('Session timed out due to inactivity');
                logout();
                return false;
            }
        }
        return true;
    }, [logout]);

    const updateActivity = useCallback(() => {
        // Throttle updates to local storage to avoid excessive writes
        const lastActivity = localStorage.getItem('last_activity');
        if (!lastActivity || Date.now() - parseInt(lastActivity, 10) > 60 * 1000) { // Update at most once per minute
            localStorage.setItem('last_activity', Date.now().toString());
        }
    }, []);

    useEffect(() => {
        const token = authService.getToken();
        const userInfoStr = localStorage.getItem('user_info');

        // Check session validity immediately
        const isSessionValid = checkSession();

        if (token && isSessionValid) {
            setIsAuthenticated(true);
            // Ensure last_activity is set if it's missing but we have a token (legacy session or fresh load)
            if (!localStorage.getItem('last_activity')) {
                localStorage.setItem('last_activity', Date.now().toString());
            }

            if (userInfoStr) {
                try {
                    setUser(JSON.parse(userInfoStr));
                } catch (e) {
                    console.error('Failed to parse user info', e);
                }
            }
        } else if (token && !isSessionValid) {
            // Token exists but session expired
            logout();
        }

        setIsLoading(false);
    }, [checkSession, logout]);

    // Setup activity listeners and periodic checks when authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }

        // Initialize activity timestamp if not present
        if (!localStorage.getItem('last_activity')) {
            localStorage.setItem('last_activity', Date.now().toString());
        }

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

        const handleActivity = () => {
            updateActivity();
        };

        // Add event listeners
        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        // Periodic check for timeout (every 1 minute)
        activityIntervalRef.current = setInterval(() => {
            checkSession();
        }, 60 * 1000);

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
            if (activityIntervalRef.current) {
                clearInterval(activityIntervalRef.current);
            }
        };
    }, [isAuthenticated, checkSession, updateActivity]);

    const login = useCallback(async (userName: string, password: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await authService.login(userName, password);

            // Extract merchant ID from the nested structure (merchants or user.merchant)
            const mId = response.merchant?.id || response.user?.merchant?.id;

            setIsAuthenticated(true);
            localStorage.setItem('last_activity', Date.now().toString()); // Initialize activity on login
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

            // Domain Check: Only allow @altolabs.ai emails
            if (!response.user?.email?.endsWith('@altolabs.ai')) {
                authService.logout(); // Clear the session we just potentially created
                throw new Error('Access Denied: Please use an @altolabs.ai email address.');
            }

            setIsAuthenticated(true);
            localStorage.setItem('last_activity', Date.now().toString()); // Initialize activity upon Google login
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

    // logout is already defined above with useCallback to break circular dependency
    // removing the duplicate definition here


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
