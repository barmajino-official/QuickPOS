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

// 7. Styles (always last)
import loginCss from './LoginPage.css?url';


export const links: Route.LinksFunction = () => [
  { rel: 'stylesheet', href: loginCss },
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
    <div className="login_page">
      <header className="login_header">
        <div className="login_brand">QuickPOS Pro</div>
        <label className="swap swap-rotate">
          <input type="checkbox" checked={isDark} onChange={handleToggleTheme} />
          <div className="swap-on">🌙</div>
          <div className="swap-off">☀️</div>
        </label>
      </header>

      <main className="login_main">
        <div className="login_container">
          <div className="login_lockscreen">
            <div className="lockscreen_time">{timeLabel}</div>
            <div className="lockscreen_date">{dateLabel}</div>
            <div className="lockscreen_greeting">System Ready</div>
          </div>

          <div className="login_card m3-elevation-2">
            <div className="login_card_head">
              <h1 className="login_title">
                {isRegister ? 'First-time setup' : 'Sign in'}
              </h1>
              <p className="login_subtitle">
                {isRegister
                  ? 'Create the owner account to get started.'
                  : 'Enter your work credentials to continue.'}
              </p>
            </div>

            <form className="login_form" onSubmit={handleSubmit}>
              {isRegister && (
                <div className="login_field">
                  <label className="login_label">Full name</label>
                  <input
                    type="text"
                    className="input input-bordered login_input"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="login_field">
                <label className="login_label">Email address</label>
                <input
                  type="email"
                  className="input input-bordered login_input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="login_field">
                <label className="login_label">Password</label>
                <input
                  type="password"
                  className="input input-bordered login_input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary login_submit" disabled={submitting}>
                {submitting
                  ? <span className="loading loading-spinner loading-sm" />
                  : isRegister ? 'Complete setup' : 'Sign in'}
              </button>
            </form>

            <div className="login_toggle_wrap">
              <button type="button" className="login_toggle_btn" onClick={handleToggleMode}>
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
