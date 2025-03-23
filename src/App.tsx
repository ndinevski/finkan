import { useEffect } from "react";
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

  useEffect(() => {
    auth.getSession().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
      }
    });
  }, [setUser]);

  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<AuthForm />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <div className="min-h-screen bg-gray-100">
                <nav className="bg-white shadow-sm">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                      <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                          <h1 className="text-xl font-bold text-gray-900">
                            FinKan
                          </h1>
                        </div>
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
  );
}

export default App;
