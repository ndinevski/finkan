import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuthStore } from "@/lib/store/auth-store";
import { MsalProvider, useMsal } from "@azure/msal-react";
import { msalInstance } from "./microsoft-auth-config";
import { API_BASE_URL } from "../config";
import { EventType } from "@azure/msal-browser";

interface AuthContextProps {
  isAuthenticated: boolean;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
  isAuthenticated: false,
  isLoading: true,
  checkAuth: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// Component to handle MSAL events and initialization
function MsalAuthenticationHandler({ children }: { children: ReactNode }) {
  const { instance } = useMsal();
  const { handleMicrosoftRedirect } = useAuthStore();
  const [isMsalInitialized, setIsMsalInitialized] = useState(false);

  // Set up event listeners for MSAL
  useEffect(() => {
    // First ensure MSAL is initialized
    const initializeMsal = async () => {
      try {
        // Make sure MSAL is initialized before proceeding
        await msalInstance.initialize();
        setIsMsalInitialized(true);
        console.log("MSAL initialized successfully");

        // Now handle any redirect response - explicitly using SPA redirect handling
        try {
          // Ensure we're handling this as a SPA
          const response = await msalInstance.handleRedirectPromise();
          if (response) {
            console.log("MSAL redirect response received:", response);
            // Process the response by exchanging the token with our backend
            await handleMicrosoftRedirect();
            console.log("Microsoft redirect processed successfully");
          }
        } catch (err) {
          console.error(
            "Error handling redirect in MsalAuthenticationHandler:",
            err
          );
        }
      } catch (error) {
        console.error("Failed to initialize MSAL:", error);
      }
    };

    initializeMsal();

    // Listen for MSAL events for logging and debugging
    const callbackId = instance.addEventCallback((event) => {
      if (
        event.eventType === EventType.LOGIN_SUCCESS ||
        event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS
      ) {
        console.log(`MSAL Event: ${event.eventType}`, event);
      }

      if (
        event.eventType === EventType.LOGIN_FAILURE ||
        event.eventType === EventType.ACQUIRE_TOKEN_FAILURE
      ) {
        console.error(`MSAL Event: ${event.eventType}`, event);
      }
    });

    return () => {
      if (callbackId) {
        instance.removeEventCallback(callbackId);
      }
    };
  }, [instance, handleMicrosoftRedirect]);

  // Don't render children until MSAL is initialized
  if (!isMsalInitialized) {
    return <div>Initializing authentication...</div>;
  }

  return <>{children}</>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoading, setUser } = useAuthStore();
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  const checkAuth = async () => {
    try {
      console.log("Checking authentication status...");
      // Check if user is authenticated through session
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        console.log("User authenticated:", data.user);
        setUser(data.user);

        // Check if we need to redirect after successful login
        const redirectPath = sessionStorage.getItem("redirectAfterLogin");
        if (redirectPath && window.location.pathname.includes("/auth")) {
          console.log(`Redirecting to ${redirectPath} after login`);
          sessionStorage.removeItem("redirectAfterLogin");
          window.location.href = redirectPath;
        }
      } else {
        console.log("User not authenticated");
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
    } finally {
      setIsAuthChecked(true);
    }
  };
  useEffect(() => {
    // Don't check auth immediately - let MsalAuthenticationHandler initialize MSAL first
    // and handle any redirects before we check general auth status
    const timer = setTimeout(() => {
      console.log("Running delayed auth check");
      checkAuth();
    }, 1000); // Increased to 1000ms for better reliability

    return () => clearTimeout(timer);
  }, []);

  const value = {
    isAuthenticated: !!user,
    isLoading: isLoading && !isAuthChecked,
    checkAuth,
  };
  return (
    <AuthContext.Provider value={value}>
      <MsalProvider instance={msalInstance}>
        <MsalAuthenticationHandler>{children}</MsalAuthenticationHandler>
      </MsalProvider>
    </AuthContext.Provider>
  );
}
