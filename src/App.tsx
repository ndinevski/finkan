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
import { Moon, Sun } from "lucide-react";
import { Button } from "./components/ui/button";

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
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">
      <Router>
        <Routes>
          <Route path="/auth" element={<AuthForm />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <div className="min-h-screen">
                  <nav className="bg-surface-light dark:bg-surface-dark shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="flex justify-between h-16">
                        <div className="flex">
                          <div className="flex-shrink-0 flex items-center">
                            <h1 className="text-xl font-bold text-primary-dark dark:text-primary-light">
                              FinKan
                            </h1>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsDark(!isDark)}
                            className="mr-2"
                          >
                            {isDark ? (
                              <Sun className="h-5 w-5" />
                            ) : (
                              <Moon className="h-5 w-5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </nav>

                  <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="px-4 py-6 sm:px-0">
                      <WorkspaceList />
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
                <WorkspacePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/board/:boardId"
            element={
              <PrivateRoute>
                <ProjectBoard />
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
