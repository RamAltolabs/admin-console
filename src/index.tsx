import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { MerchantProvider } from './context/MerchantContext';
import { AuthProvider } from './context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';

const resolveGoogleClientId = (): string => {
  const searchParams = new URLSearchParams(window.location.search);
  const project = String(searchParams.get('project') || '').trim().toLowerCase();

  if (project === 'earth') {
    return process.env.REACT_APP_GOOGLE_CLIENT_ID_EARTH || process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
  }
  if (project === 'pluto') {
    return process.env.REACT_APP_GOOGLE_CLIENT_ID_PLUTO || process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
  }
  if (project === 'nebula') {
    return process.env.REACT_APP_GOOGLE_CLIENT_ID_NEBULA || process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
  }
  return process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={resolveGoogleClientId()}>
      <AuthProvider>
        <MerchantProvider>
          <App />
        </MerchantProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
