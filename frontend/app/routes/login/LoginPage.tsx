/**
 * @file LoginPage.tsx
 * @description Login page with support for first-time admin registration.
 *              If a session already exists, redirects to the user's highest-priority
 *              permitted page. Also serves the index route ("/").
 *
 * @notes  CSS lives in ./LoginPage.css — edit styles there, not inline.
 *         Uses sessionStore for auth and uiStore for toast feedback.
 *         Landing route is resolved by getLandingPath so cashiers (pos-only) are
 *         not bounced to a dashboard they cannot see.
 */

// 1. React core
import { useState, useEffect } from 'react';

// 2. Third-party libraries
import { useNavigate, Navigate } from 'react-router';

// 3. Internal — API
import { authApi } from '~/api/auth';

// 4. Internal — Store
import { useSessionStore } from '~/store/sessionStore';
import { useUiStore } from '~/store/uiStore';

// 5. Internal — Lib
import { getLandingPath } from '~/lib/permissions';

// 6. Internal — Types
import type { Route } from './+types/LoginPage';

export const links: Route.LinksFunction = () => [
];

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { token, staff, setSession } = useSessionStore();
  const { showToast } = useUiStore();
  const navigate = useNavigate();

  const [isDark, setIsDark] = useState(false);
  const [time, setTime] = useState(new Date());

  /* ── Initialize theme ── */
  useState(() => {
    // Synchronously check if theme can be initialized on mount to avoid flicker
    if (typeof window !== 'undefined') {
      const currentTheme = localStorage.getItem('pos_theme') || 'montajat';
      document.documentElement.setAttribute('data-theme', currentTheme);
    }
  });

  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || localStorage.getItem('pos_theme') || 'montajat';
    setIsDark(currentTheme === 'montajat-dark');

    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* ── Auto-redirect if already logged in ── */
  if (token && staff) {
    return <Navigate to={getLandingPath(staff)} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = isRegister
        ? await authApi.register({ email, password, name })
        : await authApi.login({ email, password });

      setSession(res.token, res.staff);
      showToast(isRegister ? 'Account created' : 'Welcome back', 'success');
      navigate(getLandingPath(res.staff), { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleMode = () => setIsRegister(!isRegister);

  const handleToggleTheme = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextTheme = e.target.checked ? 'montajat-dark' : 'montajat';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('pos_theme', nextTheme);
    setIsDark(e.target.checked);
  };

  const dateLabel = time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const timeLabel = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-base-200)]">
      <header className="flex justify-between items-center px-6 py-5 sm:px-10">
        <div className="text-xl font-bold tracking-tight text-[var(--color-primary)]">QuickPOS Pro</div>
        <label className="swap swap-rotate text-2xl">
          <input type="checkbox" checked={isDark} onChange={handleToggleTheme} />
          <div className="swap-on">🌙</div>
          <div className="swap-off">☀️</div>
        </label>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24 w-full max-w-5xl px-6">
          <div className="flex flex-col items-center md:items-start text-center md:text-left select-none animate-[fadeUp_0.6s_var(--m3-standard)_both]">
            <div className="text-6xl sm:text-7xl md:text-8xl font-display font-light tracking-tight text-[var(--color-primary)] leading-none [font-variation-settings:'wght'_300,'wdth'_100]">{timeLabel}</div>
            <div className="text-lg sm:text-xl md:text-2xl font-display font-medium text-[var(--color-base-content)] mt-4 tracking-wide [font-variation-settings:'wght'_400]">{dateLabel}</div>
            <div className="text-xs uppercase tracking-widest text-[var(--color-neutral)] mt-3 font-mono opacity-80">System Ready</div>
          </div>

          <div className="bg-[var(--color-base-100)] w-full max-w-md rounded-[28px] p-8 sm:p-10 animate-[fadeUp_0.5s_var(--m3-emphasized)_both] m3-elevation-2">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-display font-semibold text-[var(--color-base-content)] tracking-tight [font-variation-settings:'wght'_500,'wdth'_105]">
                {isRegister ? 'First-time setup' : 'Sign in'}
              </h1>
              <p className="text-sm text-[var(--color-neutral)] mt-2">
                {isRegister
                  ? 'Create the owner account to get started.'
                  : 'Enter your work credentials to continue.'}
              </p>
            </div>

            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              {isRegister && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-[var(--color-base-content)] uppercase tracking-wider px-1 opacity-80">Full name</label>
                  <input
                    type="text"
                    className="input input-bordered w-full rounded-2xl bg-[var(--color-base-100)] border-[var(--color-base-300)] focus:outline-none focus:border-[var(--color-primary)] focus:shadow-sm"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-[var(--color-base-content)] uppercase tracking-wider px-1 opacity-80">Email address</label>
                <input
                  type="email"
                  className="input input-bordered w-full rounded-2xl bg-[var(--color-base-100)] border-[var(--color-base-300)] focus:outline-none focus:border-[var(--color-primary)] focus:shadow-sm"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-[var(--color-base-content)] uppercase tracking-wider px-1 opacity-80">Password</label>
                <input
                  type="password"
                  className="input input-bordered w-full rounded-2xl bg-[var(--color-base-100)] border-[var(--color-base-300)] focus:outline-none focus:border-[var(--color-primary)] focus:shadow-sm"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary w-full mt-3 rounded-full text-sm font-semibold tracking-wide h-12 uppercase" disabled={submitting}>
                {submitting
                  ? <span className="loading loading-spinner loading-sm" />
                  : isRegister ? 'Complete setup' : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button type="button" className="text-sm font-medium text-[var(--color-primary)] hover:underline" onClick={handleToggleMode}>
                {isRegister
                  ? 'Already set up? Sign in'
                  : 'First time? Set up admin account'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
