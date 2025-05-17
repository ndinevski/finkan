import { useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/lib/store/auth-store";
import { msalInstance } from "@/lib/auth/microsoft-auth-config";

export function AuthCallback() {
  const { handleMicrosoftRedirect } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const errorParam = searchParams.get("error");
    const errorDescParam = searchParams.get("error_description");
    const codeParam = searchParams.get("code");
    const stateParam = searchParams.get("state");

    setDebugInfo({
      searchParams: Object.fromEntries(searchParams.entries()),
      location: window.location.href,
      accounts: msalInstance.getAllAccounts(),
      hasCode: !!codeParam,
      hasState: !!stateParam,
      timestamp: new Date().toISOString(),
    });

    if (errorParam) {
      console.error("Error in auth callback URL:", errorParam, errorDescParam);
      setError(`${errorParam}: ${errorDescParam || "Unknown error"}`);
      setIsProcessing(false);
      return;
    }

    const processRedirect = async () => {
      try {
        console.log("Auth callback: Starting redirect handling");

        const msalResponse = await msalInstance.handleRedirectPromise();

        if (msalResponse) {
          console.log("MSAL redirect response received:", msalResponse);

          await handleMicrosoftRedirect();
          console.log("Auth callback: Redirect handling complete");
        } else {
          console.log("No MSAL response, checking accounts...");

          const accounts = msalInstance.getAllAccounts();

          if (accounts.length > 0) {
            console.log(
              "Found existing accounts, attempting silent token acquisition"
            );
            try {
              await handleMicrosoftRedirect();
            } catch (silentErr) {
              console.error("Error in silent token acquisition:", silentErr);
              setError("Failed to authenticate silently with existing account");
              setIsProcessing(false);
              return;
            }
          } else {
            console.error("No MSAL response and no accounts found");
            setError("Authentication failed: No response from Microsoft");
            setIsProcessing(false);
            return;
          }
        }

        setIsProcessing(false);
      } catch (err) {
        console.error("Error processing authentication redirect:", err);
        setError(err instanceof Error ? err.message : String(err));
        setIsProcessing(false);
      }
    };

    processRedirect();
  }, [handleMicrosoftRedirect, searchParams]);
  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Processing your sign-in...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center max-w-md p-6 bg-surface-light dark:bg-surface-dark rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4 text-red-500">
            Authentication Error
          </h2>
          <p className="mb-4">{error}</p>
          <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded overflow-auto text-left">
            <h3 className="font-bold mb-2">Debug Information:</h3>
            <pre className="text-xs whitespace-pre-wrap">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
          <button
            onClick={() => (window.location.href = "/auth")}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return <Navigate to="/" />;
}
