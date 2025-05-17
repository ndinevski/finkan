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
import { Spinner } from "@/components/ui/spinner";

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

function MsalAuthenticationHandler({ children }: { children: ReactNode }) {
  const { instance } = useMsal();
  const { handleMicrosoftRedirect } = useAuthStore();
  const [isMsalInitialized, setIsMsalInitialized] = useState(false);

  useEffect(() => {
    const initializeMsal = async () => {
      try {
        await msalInstance.initialize();
        setIsMsalInitialized(true);
        console.log("MSAL initialized successfully");

        try {
          const response = await msalInstance.handleRedirectPromise();
          if (response) {
            console.log("MSAL redirect response received:", response);

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

  if (!isMsalInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoading, setUser } = useAuthStore();
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  const checkAuth = async () => {
    try {
      console.log("Checking authentication status...");

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        console.log("User authenticated:", data.user);
        setUser(data.user);

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
    const timer = setTimeout(() => {
      console.log("Running delayed auth check");
      checkAuth();
    }, 1000);

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
