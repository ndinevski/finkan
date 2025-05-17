import { Link } from "react-router-dom";
import { Moon, Sun, ArrowLeft, LogOut, User } from "lucide-react";
import { Button } from "../ui/button";
import { useAuthStore } from "@/lib/store/auth-store";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface HeaderProps {
  isDark: boolean;
  onToggleDark: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
}

export function Header({
  isDark,
  onToggleDark,
  showBackButton,
  onBack,
}: HeaderProps) {
  const { user, signOut } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full bg-surface-light dark:bg-surface-dark shadow z-20 h-16">
      <div className="w-full mx-auto px-3 py-4">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            <Link to="/" className="flex items-center">
              <div className="flex justify-center items-center">
                <img
                  src="finkan.png"
                  alt="FinKan Logo"
                  className="h-10 w-auto"
                />
                <h1 className="text-center text-3xl mb-1 font-bold text-primary dark:text-primary-light">
                  FinKan
                </h1>
              </div>
            </Link>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleDark}
              className="text-primary dark:text-primary-light"
            >
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative rounded-full bg-gray-200 dark:bg-gray-800 p-1"
                    aria-label="User menu"
                  >
                    <User className="h-5 w-7 text-primary dark:text-primary-light" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-text-light dark:text-text-dark">
                      {user.email.split("@")[0] || user.email || "User"}
                    </p>
                    {user.email && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                    )}
                  </div>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
