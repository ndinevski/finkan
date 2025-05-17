import React, { useState } from "react";
import { msalInstance } from "@/lib/auth/microsoft-auth-config";
import { Button } from "../ui/button";
import { API_BASE_URL } from "@/lib/config";

export function AuthDebugTools() {
  const [isVisible, setIsVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const checkMsalConfig = () => {
    const accounts = msalInstance.getAllAccounts();
    const config = {
      redirectUri: "http://localhost:5173/auth-callback",
      baseUrl: window.location.origin,
      accountsFound: accounts.length,
      apiBaseUrl: API_BASE_URL,
    };

    setDebugInfo(config);
  };

  const clearCache = () => {
    Object.keys(localStorage).forEach((key) => {
      if (key.includes("msal")) {
        localStorage.removeItem(key);
        console.log("Removed:", key);
      }
    });

    Object.keys(sessionStorage).forEach((key) => {
      if (key.includes("msal")) {
        sessionStorage.removeItem(key);
        console.log("Removed from session:", key);
      }
    });

    setDebugInfo({ message: "Auth cache cleared" });
  };

  const forceLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      clearCache();

      window.location.href =
        "https://login.microsoftonline.com/common/oauth2/v2.0/logout?post_logout_redirect_uri=" +
        encodeURIComponent(window.location.origin);
    } catch (error) {
      console.error("Logout error:", error);
      setDebugInfo({ error: String(error) });
    }
  };

  const testAuth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      setDebugInfo({ authStatus: "Authenticated", user: data.user });
    } catch (error) {
      console.error("Auth test error:", error);
      setDebugInfo({ authStatus: "Not authenticated", error: String(error) });
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(!isVisible)}
        className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-bold"
      >
        {isVisible ? "Hide Debug" : "Auth Debug"}
      </Button>

      {isVisible && (
        <div className="mt-2 p-4 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-yellow-500">
          <h3 className="font-bold mb-3">Auth Debug Tools</h3>

          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={checkMsalConfig}
              className="w-full"
            >
              Check MSAL Config
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={clearCache}
              className="w-full"
            >
              Clear Auth Cache
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={forceLogout}
              className="w-full"
            >
              Force Logout (Microsoft)
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={testAuth}
              className="w-full"
            >
              Test Authentication
            </Button>
          </div>

          {debugInfo && (
            <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-auto max-h-40">
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
