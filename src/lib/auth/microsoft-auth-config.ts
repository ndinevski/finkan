import { Configuration, PublicClientApplication, RedirectRequest, SilentRequest } from "@azure/msal-browser";
import { MICROSOFT_CLIENT_ID } from "../config";

// MSAL configuration for Single-Page Application
const msalConfig: Configuration = {
  auth: {
    clientId: MICROSOFT_CLIENT_ID,
    authority: "https://login.microsoftonline.com/common",
    redirectUri: "http://localhost:5173/auth-callback", // Use exact string to match Azure configuration
    navigateToLoginRequestUrl: false, // Set to false to avoid issues with redirect
    postLogoutRedirectUri: "http://localhost:5173", // Explicitly set the client type to SPA (Single-Page Application)
  },
  cache: {
    cacheLocation: "sessionStorage", // Using sessionStorage for better security
    storeAuthStateInCookie: false    // Set to false for SPA applications
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case 0:
            console.error(message);
            break;
          case 1:
            console.warn(message);
            break;
          case 2:
            console.info(message);
            break;
          case 3:
            console.debug(message);
            break;
          default:
            break;
        }
      },
      logLevel: 2
    },
  }
};

// Authentication request configuration
export const loginRequest: RedirectRequest = {
  scopes: ["user.read"],
  prompt: "select_account",
};

export const silentRequest: SilentRequest = {
  scopes: ["user.read"]
};

// Make sure token acquisition uses SPA-appropriate scopes
export const tokenRequest = {
  scopes: ["User.Read", "openid", "profile", "email"],
  // Add any other scopes your application needs
};

// Initialize MSAL
export const msalInstance = new PublicClientApplication(msalConfig);
