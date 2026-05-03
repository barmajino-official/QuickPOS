import { useState, useEffect } from "react";

// SVG Icons
const IconSun = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </svg>
);
const IconMoon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);
const IconBrand = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);

interface Props {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  error: string;
  loading: boolean;
  handleLogin: (e: React.FormEvent) => void;
  theme?: string;
  toggleTheme?: () => void;
  isRegisterMode: boolean;
  setIsRegisterMode: (v: boolean) => void;
}

export default function LoginView({
  email,
  setEmail,
  password,
  setPassword,
  error,
  loading,
  handleLogin,
  theme,
  toggleTheme,
  isRegisterMode,
  setIsRegisterMode,
}: Props) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 text-base-content font-sans p-4 relative">
      <div className="absolute top-0 w-full p-4 flex justify-between items-center max-w-7xl mx-auto">
        <div className="font-mono text-sm font-bold opacity-70 hidden sm:block">
          {currentTime.toLocaleString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </div>
        <label className="swap swap-rotate btn btn-ghost btn-sm btn-circle opacity-70 hover:opacity-100 ml-auto">
          <input
            type="checkbox"
            checked={theme === "dark"}
            onChange={toggleTheme}
          />
          <div className="swap-on flex items-center justify-center">
            {IconMoon}
          </div>
          <div className="swap-off flex items-center justify-center">
            {IconSun}
          </div>
        </label>
      </div>

      <div className="w-full max-w-md bg-base-100 shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-base-300 rounded-xl overflow-hidden">
        <div className="p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="w-12 h-12 mx-auto bg-primary rounded-lg flex items-center justify-center shadow-md mb-5 text-primary-content">
              {IconBrand}
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              QuickPOS{" "}
              <span className="opacity-50 text-sm font-normal">Pro</span>
            </h1>
            <p className="text-sm opacity-60 mt-1">
              {isRegisterMode
                ? "Initial Admin Setup"
                : "Enterprise Point of Sale System"}
            </p>
          </div>

          {error && (
            <div className="bg-error/10 text-error border border-error/20 px-4 py-3 rounded-md text-sm font-medium mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 opacity-70">
                Work Email
              </label>
              <input
                type="email"
                className="w-full px-4 py-2.5 bg-base-100 border border-base-300 rounded-md text-sm placeholder:opacity-40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-base-content"
                placeholder="admin@quickpos.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 opacity-70">
                Password
              </label>
              <input
                type="password"
                className="w-full px-4 py-2.5 bg-base-100 border border-base-300 rounded-md text-sm placeholder:opacity-40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-base-content"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button
              className="w-full bg-primary hover:bg-primary-focus text-primary-content font-semibold rounded-md py-2.5 px-4 mt-4 shadow-sm transition-colors flex items-center justify-center min-h-[44px] border-none"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner text-primary-content"></span>
              ) : isRegisterMode ? (
                "Create Admin Account"
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-base-300 text-center flex flex-col gap-3">
            <p className="text-xs opacity-50 font-medium">
              Secure access for authorized personnel only.
            </p>

            <button
              type="button"
              onClick={() => setIsRegisterMode(!isRegisterMode)}
              className="text-xs text-primary hover:underline font-bold"
            >
              {isRegisterMode
                ? "Already have an account? Sign In"
                : "First time setup? Create Admin"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
