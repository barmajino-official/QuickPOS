import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { ADMIN_PERMISSIONS } from "../../lib/auth";
import { IconSun, IconMoon, IconBrand } from "../../components/Icons";

export function Login() {
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [isRegisterMode, setRegisterMode] = useState(false);
  const [theme, setTheme]               = useState(() => localStorage.getItem("pos-theme") ?? "light");
  const [time, setTime]                 = useState(new Date());

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const toggleTheme = () =>
    setTheme(t => {
      const next = t === "dark" ? "light" : "dark";
      localStorage.setItem("pos-theme", next);
      return next;
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    setError("");

    if (isRegisterMode) {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
      if (data.user) {
        await supabase.from("staff").insert({
          id: data.user.id,
          email: data.user.email,
          name: "System Administrator",
          role: "Admin",
          permissions: ADMIN_PERMISSIONS,
        });
      }
      // If email confirmation is required, data.session is null — stop spinner.
      // Otherwise AuthProvider's onAuthStateChange handles the redirect.
      if (!data.session) setLoading(false);
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
      }
      // On success, AuthProvider's onAuthStateChange fires → session set → this component unmounts.
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 text-base-content font-sans p-4 relative">
      <div className="absolute top-0 w-full p-4 flex justify-between items-center max-w-7xl mx-auto">
        <div className="font-mono text-sm font-bold opacity-70 hidden sm:block">
          {time.toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </div>
        <label className="swap swap-rotate btn btn-ghost btn-sm btn-circle opacity-70 hover:opacity-100 ml-auto">
          <input type="checkbox" checked={theme === "dark"} onChange={toggleTheme} />
          <div className="swap-on flex items-center justify-center">{IconMoon}</div>
          <div className="swap-off flex items-center justify-center">{IconSun}</div>
        </label>
      </div>

      <div className="w-full max-w-md bg-base-100 shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-base-300 rounded-xl overflow-hidden">
        <div className="p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="w-12 h-12 mx-auto bg-primary rounded-lg flex items-center justify-center shadow-md mb-5 text-primary-content">
              {IconBrand}
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              QuickPOS <span className="opacity-50 text-sm font-normal">Pro</span>
            </h1>
            <p className="text-sm opacity-60 mt-1">
              {isRegisterMode ? "Initial Admin Setup" : "Enterprise Point of Sale System"}
            </p>
          </div>

          {error && (
            <div className="bg-error/10 text-error border border-error/20 px-4 py-3 rounded-md text-sm font-medium mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 opacity-70">
                Work Email
              </label>
              <input
                type="email"
                className="w-full px-4 py-2.5 bg-base-100 border border-base-300 rounded-md text-sm placeholder:opacity-40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-base-content"
                placeholder="admin@quickpos.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
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
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-focus text-primary-content font-semibold rounded-md py-2.5 px-4 mt-4 shadow-sm transition-colors flex items-center justify-center min-h-[44px] border-none"
            >
              {loading ? (
                <span className="loading loading-spinner text-primary-content" />
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
              onClick={() => { setRegisterMode(m => !m); setError(""); }}
              className="text-xs text-primary hover:underline font-bold"
            >
              {isRegisterMode ? "Already have an account? Sign In" : "First time setup? Create Admin"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
