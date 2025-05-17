import { useState, useEffect } from "react";
import { AUTH_BASE_URL } from "@/lib/config";
import { useAuth } from "@/lib/auth/auth-provider";

export default function AuthDebugPage() {
  const [authStatus, setAuthStatus] = useState<{
    cookiePresent: boolean;
    authEndpointResponse: any;
  }>({
    cookiePresent: false,
    authEndpointResponse: null,
  });

  const { isAuthenticated, isLoading, checkAuth } = useAuth();

  function getCookie(name: string): string | undefined {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift();
    return undefined;
  }

  useEffect(() => {
    async function checkAuthEndpoint() {
      const cookiePresent = getCookie("token") !== undefined;

      try {
        const response = await fetch(`${AUTH_BASE_URL}/auth/me`, {
          credentials: "include",
        });

        const data = await response.json();

        setAuthStatus({
          cookiePresent,
          authEndpointResponse: {
            status: response.status,
            statusText: response.statusText,
            data,
          },
        });
      } catch (error) {
        setAuthStatus({
          cookiePresent,
          authEndpointResponse: {
            error: String(error),
          },
        });
      }
    }

    if (!isLoading) {
      checkAuthEndpoint();
    }
  }, [isLoading]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Debug</h1>

      <div className="mb-4 p-4 border rounded">
        <h2 className="text-xl font-bold">Auth Provider State</h2>
        <p>Is Loading: {isLoading ? "Yes" : "No"}</p>
        <p>Is Authenticated: {isAuthenticated ? "Yes" : "No"}</p>
        <button
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
          onClick={() => checkAuth()}
        >
          Refresh Auth Status
        </button>
      </div>

      <div className="mb-4 p-4 border rounded">
        <h2 className="text-xl font-bold">Auth Cookie Status</h2>
        <p>Token Cookie Present: {authStatus.cookiePresent ? "Yes" : "No"}</p>
      </div>

      <div className="mb-4 p-4 border rounded">
        <h2 className="text-xl font-bold">Auth Endpoint Test</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(authStatus.authEndpointResponse, null, 2)}
        </pre>
      </div>

      <div className="mb-4 p-4 border rounded">
        <h2 className="text-xl font-bold">All Cookies</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {document.cookie || "No cookies found"}
        </pre>
      </div>
    </div>
  );
}
