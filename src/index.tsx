import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { MerchantProvider } from './context/MerchantContext';
import { AuthProvider } from './context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={process.env.GOOGLE_CLIENT_ID || ''}>
      <AuthProvider>
        <MerchantProvider>
          <App />
        </MerchantProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
