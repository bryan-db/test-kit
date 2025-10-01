/**
 * Authentication Service with OAuth 2.0 + PKCE Flow
 * Implements T013 with dev mode support
 *
 * Features:
 * - OAuth 2.0 with PKCE (Proof Key for Code Exchange)
 * - Development mode with hardcoded token
 * - Token refresh before expiration
 * - React Context for token management
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ==========================================
// PKCE Utilities
// ==========================================

/**
 * Generate a cryptographically random code verifier (43-128 characters)
 * @returns {string} Random code verifier
 */
export function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

/**
 * Generate PKCE code challenge from code verifier
 * Uses SHA-256 hash
 * @param {string} verifier - Code verifier
 * @returns {Promise<string>} Base64-URL encoded SHA-256 hash
 */
export async function generatePKCEChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(new Uint8Array(hash));
}

/**
 * Base64-URL encode (RFC 7636)
 * @param {Uint8Array} buffer - Data to encode
 * @returns {string} Base64-URL encoded string
 */
function base64URLEncode(buffer) {
  const base64 = btoa(String.fromCharCode(...buffer));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// ==========================================
// OAuth 2.0 Flow
// ==========================================

/**
 * Initiate OAuth 2.0 login with PKCE
 * Redirects user to Databricks authorization page
 * @param {string} clientId - OAuth client ID
 * @param {string} redirectUri - Callback URI
 * @param {string[]} scopes - Requested scopes
 */
export async function initiateLogin(clientId, redirectUri, scopes = ['jobs:read', 'jobs:write', 'catalogs:read']) {
  // Generate PKCE parameters
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generatePKCEChallenge(codeVerifier);
  const state = generateCodeVerifier(); // CSRF protection

  // Store PKCE parameters for callback
  sessionStorage.setItem('pkce_code_verifier', codeVerifier);
  sessionStorage.setItem('oauth_state', state);

  // Build authorization URL
  const baseUrl = import.meta.env.VITE_DATABRICKS_HOST || 'https://e2-demo-field-eng.cloud.databricks.com';
  const authUrl = new URL(`${baseUrl}/oauth/authorize`);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scopes.join(' '));
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  // Redirect to authorization page
  window.location.href = authUrl.toString();
}

/**
 * Handle OAuth callback and exchange authorization code for tokens
 * @param {string} authCode - Authorization code from callback
 * @param {string} state - State parameter from callback
 * @returns {Promise<Object>} Token object with access_token, refresh_token, expires_at
 */
export async function handleCallback(authCode, state) {
  // Verify state (CSRF protection)
  const savedState = sessionStorage.getItem('oauth_state');
  if (state !== savedState) {
    throw new Error('Invalid state parameter - possible CSRF attack');
  }

  // Retrieve PKCE code verifier
  const codeVerifier = sessionStorage.getItem('pkce_code_verifier');
  if (!codeVerifier) {
    throw new Error('Code verifier not found - authentication flow corrupted');
  }

  // Exchange code for tokens
  const baseUrl = import.meta.env.VITE_DATABRICKS_HOST || 'https://e2-demo-field-eng.cloud.databricks.com';
  const clientId = import.meta.env.VITE_OAUTH_CLIENT_ID;
  const redirectUri = `${window.location.origin}/oauth/callback`;

  const response = await fetch(`${baseUrl}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: authCode,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = await response.json();

  // Clear PKCE parameters
  sessionStorage.removeItem('pkce_code_verifier');
  sessionStorage.removeItem('oauth_state');

  // Return token with expiration timestamp
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in * 1000),
    token_type: data.token_type || 'Bearer',
  };
}

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Current refresh token
 * @returns {Promise<Object>} New token object
 */
export async function refreshAccessToken(refreshToken) {
  const baseUrl = import.meta.env.VITE_DATABRICKS_HOST || 'https://e2-demo-field-eng.cloud.databricks.com';
  const clientId = import.meta.env.VITE_OAUTH_CLIENT_ID;

  const response = await fetch(`${baseUrl}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
    }),
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  const data = await response.json();

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || refreshToken, // Some implementations don't return new refresh token
    expires_at: Date.now() + (data.expires_in * 1000),
    token_type: data.token_type || 'Bearer',
  };
}

/**
 * Refresh token if it expires within 5 minutes
 * @param {Object} currentToken - Current token object
 * @returns {Promise<Object>} Current or refreshed token
 */
export async function refreshTokenIfNeeded(currentToken) {
  if (!currentToken) {
    return null;
  }

  const fiveMinutes = 5 * 60 * 1000;
  const needsRefresh = currentToken.expires_at - Date.now() < fiveMinutes;

  if (needsRefresh && currentToken.refresh_token) {
    return await refreshAccessToken(currentToken.refresh_token);
  }

  return currentToken;
}

/**
 * Logout and revoke tokens
 * @param {string} accessToken - Access token to revoke
 */
export async function logout(accessToken) {
  if (!accessToken) {
    return;
  }

  try {
    const baseUrl = import.meta.env.VITE_DATABRICKS_HOST || 'https://e2-demo-field-eng.cloud.databricks.com';
    await fetch(`${baseUrl}/api/2.0/oauth/revoke`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: accessToken }),
    });
  } catch (error) {
    console.error('Token revocation failed:', error);
  }
}

// ==========================================
// Development Mode
// ==========================================

/**
 * Get development token from environment
 * @returns {Object|null} Dev token object or null
 */
export function getDevToken() {
  const devToken = import.meta.env.VITE_DEV_TOKEN;
  if (devToken && import.meta.env.DEV) {
    return {
      access_token: devToken,
      expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      token_type: 'Bearer',
      dev_mode: true,
    };
  }
  return null;
}

// ==========================================
// React Context for Token Management
// ==========================================

const AuthContext = createContext(null);

/**
 * Auth Provider Component
 * Manages token state and provides authentication methods
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize with dev token or check for existing session
  useEffect(() => {
    const devToken = getDevToken();
    if (devToken) {
      setToken(devToken);
      setLoading(false);
      return;
    }

    // TODO: Check for existing OAuth session in sessionStorage
    setLoading(false);
  }, []);

  // Automatic token refresh
  useEffect(() => {
    if (!token || token.dev_mode) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const refreshed = await refreshTokenIfNeeded(token);
        if (refreshed !== token) {
          setToken(refreshed);
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        setToken(null);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [token]);

  const login = useCallback(async () => {
    const devToken = getDevToken();
    if (devToken) {
      setToken(devToken);
      return;
    }

    const clientId = import.meta.env.VITE_OAUTH_CLIENT_ID;
    const redirectUri = `${window.location.origin}/oauth/callback`;
    await initiateLogin(clientId, redirectUri);
  }, []);

  const handleLogout = useCallback(async () => {
    if (token && !token.dev_mode) {
      await logout(token.access_token);
    }
    setToken(null);
  }, [token]);

  const value = {
    token,
    loading,
    isAuthenticated: !!token,
    login,
    logout: handleLogout,
    getAccessToken: () => token?.access_token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
