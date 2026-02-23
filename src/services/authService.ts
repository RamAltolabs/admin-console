import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const AUTH_API_URL = `${process.env.REACT_APP_IT_APP_BASE_URL}ecloudbl/auth/token`;
const PORTAL_BASE_URL = (process.env.REACT_APP_PORTAL_BASE_URL || '').replace(/\/+$/, '');

export interface LoginResponse {
    token: {
        access_token: string;
        token_type: string;
        [key: string]: any;
    };
    user?: {
        id: number;
        merchant?: {
            id: number;
            merchantId: number;
            [key: string]: any;
        };
        [key: string]: any;
    };
    merchant?: {
        id: string | number;
        [key: string]: any;
    };
    [key: string]: any;
}

class AuthService {
    async login(userName: string, password: string): Promise<LoginResponse> {
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'sec-ch-ua-platform': '"Windows"',
                'sec-ch-ua': '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
                'sec-ch-ua-mobile': '?0',
            };
            if (PORTAL_BASE_URL) {
                headers.Referer = `${PORTAL_BASE_URL}/`;
            }

            const response = await axios.post<LoginResponse>(AUTH_API_URL, {
                authType: 'PG',
                userName: userName,
                password: password,
            }, {
                headers,
            });

            if (response.data && response.data.token?.access_token) {
                localStorage.setItem('auth_token', response.data.token.access_token);
            }
            return response.data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async loginWithGoogle(credential: string, isAccessToken: boolean = false): Promise<LoginResponse> {
        console.log('Google Credential received:', credential);

        try {
            let userData: any;

            if (isAccessToken) {
                // Fetch user info using the access token
                const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${credential}` }
                });
                userData = userInfoResponse.data;
            } else {
                // Decode the Google ID Token
                userData = jwtDecode(credential);
            }

            console.log('User Data:', userData);

            // Construct response using actual user data
            const response: LoginResponse = {
                token: {
                    access_token: credential, // Use the Google token as our access token for now
                    token_type: 'Bearer',
                },
                user: {
                    id: 1, // Placeholder ID
                    username: userData.email, // Use email as username
                    email: userData.email,
                    firstName: userData.given_name,
                    lastName: userData.family_name,
                    picture: userData.picture,
                    merchant: {
                        id: 100, // Default merchant for Google users
                        merchantId: 100,
                        name: 'Google Authenticated User'
                    }
                },
                merchant: {
                    id: 100
                }
            };

            localStorage.setItem('auth_token', response.token.access_token);
            // Optionally store user info for display
            localStorage.setItem('user_info', JSON.stringify(response.user));

            return response;
        } catch (error) {
            console.error('Error processing Google login:', error);
            throw error;
        }
    }

    logout() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
    }

    getToken(): string | null {
        return localStorage.getItem('auth_token');
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }
}

export default new AuthService();
