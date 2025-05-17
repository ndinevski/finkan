import { msalInstance, loginRequest } from './microsoft-auth-config';
import { API_BASE_URL, AUTH_BASE_URL } from '../config';

export const auth = {  async getSession() {
    try {
      const response = await fetch(`${AUTH_BASE_URL}/auth/me`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to get session');
      }
      
      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Session fetch error:', error);
      return { data: { user: null } };
    }
  },  async signIn(email: string, password: string) {
    try {
      const response = await fetch(`${AUTH_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to sign in');
      }
      
      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  },  async signInWithMicrosoft() {
    try {


      const request = {
        ...loginRequest,
        redirectUri: "http://localhost:5173/auth-callback",
        prompt: "select_account"
      };
      
      console.log('Initiating Microsoft login with redirect URI:', request.redirectUri);
      

      if (!msalInstance.getAllAccounts().length) {
        console.log("No accounts found, proceeding with login redirect");
        await msalInstance.loginRedirect(request);
      } else {
        console.log("Account already exists, logging out first");

        const logoutRequest = {
          account: msalInstance.getAllAccounts()[0],
          postLogoutRedirectUri: "http://localhost:5173/auth"
        };
        
        await msalInstance.logoutRedirect(logoutRequest);
      }



    } catch (error) {
      console.error('Microsoft sign in error:', error);
      throw error;
    }
  },async handleMicrosoftRedirect() {
    try {
      console.log('Client: Starting Microsoft redirect handling');
      let tokenResponse;
      

      const response = await msalInstance.handleRedirectPromise();
      
      if (response) {
        console.log('Client: MSAL Redirect response received directly');
        tokenResponse = response;
      } else {

        const accounts = msalInstance.getAllAccounts();
        console.log('Client: Accounts found:', accounts.length);
        
        if (accounts.length > 0) {

          console.log('Client: Attempting silent token acquisition');
          try {
            tokenResponse = await msalInstance.acquireTokenSilent({
              scopes: ['user.read'],
              account: accounts[0]
            });
            console.log('Client: Silent token acquisition successful');
          } catch (silentError) {
            console.error('Client: Silent token acquisition failed, trying redirect', silentError);

            await msalInstance.acquireTokenRedirect({
              scopes: ['user.read'],
              redirectUri: "http://localhost:5173/auth-callback"
            });

            return { data: null };
          }
        } else {
          throw new Error('No accounts found and no redirect response');
        }
      }
      

      const idToken = tokenResponse.idToken || '';
      const accessToken = tokenResponse.accessToken || '';
      
      if (!idToken || !accessToken) {
        console.error('Client: Missing tokens from Microsoft response');
        throw new Error('Authentication failed: Missing tokens from Microsoft');
      }
        console.log('Client: Exchanging tokens with backend');

      const exchangeResponse = await fetch(`${AUTH_BASE_URL}/auth/microsoft/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          idToken,
          accessToken 
        }),
        credentials: 'include',
      });
      
      if (!exchangeResponse.ok) {
        const errorData = await exchangeResponse.json().catch(() => ({ message: 'Failed to exchange Microsoft token' }));
        console.error('Client: Token exchange failed:', errorData);
        throw new Error(errorData.message || 'Failed to exchange Microsoft token');
      }
      
      const data = await exchangeResponse.json();
      console.log('Client: Token exchange successful');
      return { data };
    } catch (error) {
      console.error('Microsoft redirect handling error:', error);
      throw error;
    }
  },
  async signUp(email: string, password: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to sign up');
      }
      
      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  },  async signOut() {
    try {

      await fetch(`${AUTH_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      

      if (msalInstance.getAllAccounts().length > 0) {
        msalInstance.logout();
      }
      
      return { data: { user: null } };
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }
};