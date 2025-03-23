import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { auth } from "./lib/auth/client";
import { useAuthStore } from "./lib/store/auth-store";
import { AuthForm } from "./components/auth/auth-form";
import { WorkspaceList } from "./components/workspace/workspace-list";
import { WorkspacePage } from "./components/workspace/workspace-page";
import { ProjectBoard } from "./components/project/project-board";
import { Toaster } from "./components/ui/toaster";
import { Header } from "./components/layout/header";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  return <>{children}</>;
}

function App() {
  const { setUser } = useAuthStore();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    auth.getSession().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
      }
    });
  }, [setUser]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <div className="min-h-screen w-full bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">
      <Router>
        <Routes>
          <Route path="/auth" element={<AuthForm />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <div className="min-h-screen flex flex-col w-full">
                  <Header
                    isDark={isDark}
                    onToggleDark={() => setIsDark(!isDark)}
                  />
                  <main className="flex-1 w-full">
                    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                      <div className="px-4 py-6 sm:px-0">
                        <WorkspaceList />
                      </div>
                    </div>
                  </main>
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/workspace/:workspaceId"
            element={
              <PrivateRoute>
                <WorkspacePage
                  isDark={isDark}
                  onToggleDark={() => setIsDark(!isDark)}
                />
              </PrivateRoute>
            }
          />
          <Route
            path="/board/:boardId"
            element={
              <PrivateRoute>
                <ProjectBoard
                  isDark={isDark}
                  onToggleDark={() => setIsDark(!isDark)}
                />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
      <Toaster />
    </div>
  );
}

export default App;
