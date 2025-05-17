import { useState } from "react";
import { useAuthStore } from "@/lib/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock } from "lucide-react";
import { useEffect } from "react";

export function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, signInWithMicrosoft, handleMicrosoftRedirect } =
    useAuthStore();

  useEffect(() => {
    handleMicrosoftRedirect().catch(console.error);
  }, [handleMicrosoftRedirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (error) {
      console.error("Authentication error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithMicrosoft();
    } catch (error) {
      console.error("Microsoft authentication error:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
      <div className="max-w-md w-full space-y-8 p-8 bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg">
        <div>
          <div className="mx-auto flex justify-center items-center">
            <img src="finkan.png" alt="FinKan Logo" className="h-20 w-auto" />
            <h1 className="text-center text-4xl font-bold text-primary dark:text-primary-light">
              FinKan
            </h1>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-text-light dark:text-text-dark">
            {isSignUp ? "Create your account" : "Sign in to your account"}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-background-light dark:bg-background-dark border-gray-300 dark:border-gray-700"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 bg-background-light dark:bg-background-dark border-gray-300 dark:border-gray-700"
                required
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-dark dark:bg-primary-light dark:hover:bg-primary"
            >
              {isLoading ? "Please wait..." : isSignUp ? "Sign up" : "Sign in"}
            </Button>
          </div>
        </form>

        <div className="mt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-surface-light dark:bg-surface-dark text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-4">
            <Button
              type="button"
              onClick={handleMicrosoftLogin}
              disabled={isLoading}
              className="w-full bg-[#2f2f2f] hover:bg-[#1f1f1f] text-white dark:bg-[#e0e0e0] dark:text-[#2f2f2f] dark:hover:bg-[#d0d0d0] flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 23 23"
                className="h-5 w-5 mr-2"
                fill="currentColor"
              >
                <path d="M0 0h11v11H0z" fill="#f25022" />
                <path d="M12 0h11v11H12z" fill="#7fba00" />
                <path d="M0 12h11v11H0z" fill="#00a4ef" />
                <path d="M12 12h11v11H12z" fill="#ffb900" />
              </svg>
              Microsoft
            </Button>
          </div>
        </div>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
