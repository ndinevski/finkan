import { Link } from "react-router-dom";
import { Moon, Sun, ArrowLeft } from "lucide-react";
import { Button } from "../ui/button";

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
  return (
    <header className="w-full bg-surface-light dark:bg-surface-dark shadow">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
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
              <h1 className="text-xl font-bold text-text-light dark:text-text-dark hover:opacity-80 transition-opacity">
                FinKan
              </h1>
            </Link>
          </div>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleDark}
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
    </header>
  );
}
