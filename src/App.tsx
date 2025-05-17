import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth/auth-provider";
import { AuthForm } from "./components/auth/auth-form";
import { AuthCallback } from "./components/auth/auth-callback";
import { WorkspaceList } from "./components/workspace/workspace-list";
import { WorkspacePage } from "./components/workspace/workspace-page";
import { ProjectBoard } from "./components/project/project-board";
import { Toaster } from "./components/ui/toaster";
import { Header } from "./components/layout/header";
import { Sidebar } from "./components/layout/sidebar";
import AuthDebugPage from "./components/debug/auth-debug-page";
import { Spinner } from "./components/ui/spinner";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }

  return <>{children}</>;
}

function App() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    setIsDark(prefersDark);
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);
  return (
    <div className="min-h-screen w-full bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">
      <AuthProvider>
        <Router>
          {" "}
          <Routes>
            <Route path="/auth" element={<AuthForm />} />
            <Route path="/auth-callback" element={<AuthCallback />} />
            <Route path="/auth-debug" element={<AuthDebugPage />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <div className="flex flex-col w-full h-screen">
                    <Header
                      isDark={isDark}
                      onToggleDark={() => setIsDark(!isDark)}
                    />
                    <div className="flex pt-16 h-screen">
                      <Sidebar />
                      <main className="flex-1 ml-64 overflow-y-auto custom-scrollbar h-full pt-4">
                        <div className="max-w-7xl mx-auto py-2 sm:px-6 lg:px-8">
                          <div className="px-4 py-2 sm:px-0">
                            <WorkspaceList />
                          </div>
                        </div>
                      </main>
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/workspace/:workspaceId"
              element={
                <PrivateRoute>
                  <div className="flex flex-col w-full h-screen">
                    <Header
                      isDark={isDark}
                      onToggleDark={() => setIsDark(!isDark)}
                    />
                    <div className="flex pt-16 h-screen">
                      <Sidebar />
                      <main className="flex-1 ml-64 overflow-y-auto custom-scrollbar h-full pt-4">
                        <WorkspacePage />
                      </main>
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/board/:boardId"
              element={
                <PrivateRoute>
                  <div className="flex flex-col w-full h-screen">
                    <Header
                      isDark={isDark}
                      onToggleDark={() => setIsDark(!isDark)}
                    />
                    <div className="flex pt-16 h-screen">
                      <Sidebar />
                      <main className="flex-1 ml-64 overflow-y-auto custom-scrollbar h-full pt-4">
                        <ProjectBoard />
                      </main>
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
          </Routes>{" "}
        </Router>
        <Toaster />
        {/* <AuthDebugTools /> */}
      </AuthProvider>
    </div>
  );
}

export default App;
