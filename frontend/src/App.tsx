import React, { useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useThemeStore } from './store/useThemeStore';
import { useBackendHealth } from './hooks/useBackendHealth';
import MLDashboard from './pages/ml/MLDashboard';
import OperationalDashboard from './pages/operational/OperationalDashboard';
import ActivityDetailPage from './pages/activity/ActivityDetailPage';
import StrategicDashboard from './pages/strategic/StrategicDashboard';
import TacticalDashboard from './pages/tactical/TacticalDashboard';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

const NAV_ITEMS = [
  {
    href: '/strategic',
    label: 'Strategic',
    icon: (
      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    href: '/tactical',
    label: 'Tactical',
    icon: (
      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    href: '/operational',
    label: 'Operational',
    icon: (
      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    href: '/ml',
    label: 'ML Clusters',
    icon: (
      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><circle cx="12" cy="2" r="1" /><circle cx="12" cy="22" r="1" />
        <circle cx="2" cy="12" r="1" /><circle cx="22" cy="12" r="1" />
        <line x1="12" y1="5" x2="12" y2="9" /><line x1="12" y1="15" x2="12" y2="19" />
        <line x1="5" y1="12" x2="9" y2="12" /><line x1="15" y1="12" x2="19" y2="12" />
      </svg>
    ),
  },
];

/* ── Icons ───────────────────────────────────────────── */
const SunIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);
const MoonIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);
const ChevronLeft = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const ChevronDown = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const MenuIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const StravaLogo = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066z"/>
    <path d="M10.232 13.828L7.648 8.818H5L10.232 19 12.8 13.828z"/>
  </svg>
);

/* ── Sidebar ─────────────────────────────────────────── */
interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onClose?: () => void;
  mobile?: boolean;
}

function Sidebar({ collapsed, onToggle, onClose, mobile }: SidebarProps) {
  const isCollapsed = collapsed && !mobile;

  return (
    <aside
      style={{ boxShadow: '1px 0 0 0 var(--c-border)' }}
      className={`
        flex flex-col bg-c-card h-full
        transition-[width] duration-200 ease-in-out overflow-hidden shrink-0
        ${isCollapsed ? 'w-[56px]' : 'w-56'}
      `}
    >
      {/* Logo row */}
      <div className={`flex items-center shrink-0 h-14 ${isCollapsed ? 'justify-center' : 'px-4 gap-3'}`}>
        <button
          onClick={isCollapsed ? onToggle : undefined}
          className={`w-7 h-7 rounded-lg bg-strava-orange flex items-center justify-center shrink-0 text-white
            ${isCollapsed ? 'cursor-pointer hover:brightness-90 transition-all' : 'cursor-default'}`}
          title={isCollapsed ? 'Expand' : undefined}
          tabIndex={isCollapsed ? 0 : -1}
        >
          <StravaLogo size={16} />
        </button>

        {!isCollapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-c-ink font-bold text-sm leading-tight truncate">Strava Analytics</p>
              <p style={{ color: 'var(--c-ink3)' }} className="text-[11px] truncate">Performance Platform</p>
            </div>
            {!mobile && (
              <button
                onClick={onToggle}
                className="w-7 h-7 flex items-center justify-center rounded-lg transition-all shrink-0"
                style={{ color: 'var(--c-ink3)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--c-subtle)'; (e.currentTarget as HTMLElement).style.color = 'var(--c-ink)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; (e.currentTarget as HTMLElement).style.color = 'var(--c-ink3)'; }}
                title="Collapse"
              >
                <ChevronLeft />
              </button>
            )}
            {mobile && onClose && (
              <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg transition-all ml-auto" style={{ color: 'var(--c-ink2)' }}>
                <CloseIcon />
              </button>
            )}
          </>
        )}
      </div>

      {/* Nav — fills remaining space, no scroll needed for 4 items */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {!isCollapsed && (
          <p className="px-2 mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--c-ink3)' }}>Dashboards</p>
        )}
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={mobile ? onClose : undefined}
            title={isCollapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm font-medium transition-all relative group
              ${isActive ? 'text-c-ink bg-c-subtle' : 'text-c-ink2 hover:text-c-ink hover:bg-c-subtle/60'}
              ${isCollapsed ? 'justify-center' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && !isCollapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-strava-orange rounded-r-full" />
                )}
                <span className={`shrink-0 transition-colors ${isActive ? 'text-strava-orange' : 'group-hover:text-c-ink2'}`} style={!isActive ? { color: 'var(--c-ink3)' } : {}}>
                  {item.icon}
                </span>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

/* ── Top bar ─────────────────────────────────────────── */
function TopBar({ onMobileMenu }: { onMobileMenu: () => void }) {
  const { firstname, lastname, profilePhoto, logout } = useAuthStore();
  const { theme, toggle: toggleTheme } = useThemeStore();
  const initials = `${firstname?.[0] ?? ''}${lastname?.[0] ?? ''}`.toUpperCase();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header
      className="sticky top-0 z-30 flex items-center px-4 md:px-6 h-14 bg-c-card shrink-0"
      style={{ boxShadow: '0 1px 0 var(--c-border)' }}
    >
      {/* Mobile: hamburger */}
      <button
        className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg mr-3 transition-all"
        style={{ color: 'var(--c-ink2)' }}
        onClick={onMobileMenu}
      >
        <MenuIcon />
      </button>

      {/* Mobile: logo */}
      <div className="md:hidden flex items-center gap-2 mr-auto">
        <div className="w-5 h-5 rounded bg-strava-orange flex items-center justify-center text-white">
          <StravaLogo size={12} />
        </div>
        <span className="font-bold text-sm text-c-ink">Strava Analytics</span>
      </div>

      {/* Desktop spacer */}
      <div className="hidden md:block flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          className="w-9 h-9 flex items-center justify-center rounded-lg transition-all"
          style={{ color: 'var(--c-ink2)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--c-subtle)'; (e.currentTarget as HTMLElement).style.color = 'var(--c-ink)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; (e.currentTarget as HTMLElement).style.color = 'var(--c-ink2)'; }}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

        {/* User avatar + dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((s) => !s)}
            className="flex items-center gap-2 pl-1 pr-2 py-1.5 rounded-lg transition-all"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--c-subtle)'; }}
            onMouseLeave={e => { if (!menuOpen) (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}
            style={menuOpen ? { backgroundColor: 'var(--c-subtle)' } : {}}
          >
            {/* Avatar */}
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt={firstname ?? 'athlete'}
                className="w-7 h-7 rounded-full object-cover border-2"
                style={{ borderColor: 'var(--c-border)' }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'rgba(252,76,2,0.15)', border: '1px solid rgba(252,76,2,0.3)' }}
              >
                <span className="text-[10px] font-bold" style={{ color: '#FC4C02' }}>{initials || '?'}</span>
              </div>
            )}
            {/* Name (desktop only) */}
            <span className="hidden md:block text-sm font-medium text-c-ink">{firstname}</span>
            <span style={{ color: 'var(--c-ink3)' }}><ChevronDown /></span>
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-1.5 w-52 rounded-xl py-1 z-50"
              style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
            >
              {/* User info */}
              <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--c-border)' }}>
                <div className="flex items-center gap-3">
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(252,76,2,0.15)', border: '1px solid rgba(252,76,2,0.3)' }}>
                      <span className="text-xs font-bold" style={{ color: '#FC4C02' }}>{initials}</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-c-ink truncate">{firstname} {lastname}</p>
                    <p className="text-xs" style={{ color: 'var(--c-ink3)' }}>Strava Athlete</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="py-1">
                <button
                  onClick={() => { setMenuOpen(false); toggleTheme(); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-c-ink2 transition-all text-left"
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--c-subtle)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}
                >
                  {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                  {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                </button>
                <button
                  onClick={() => { setMenuOpen(false); logout(); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm transition-all text-left"
                  style={{ color: '#ef4444' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(239,68,68,0.08)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/* ── Layout ──────────────────────────────────────────── */
function Layout({ children }: { children: React.ReactNode }) {
  const health = useBackendHealth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: 'var(--c-page)', color: 'var(--c-ink)' }}>

      {/* Desktop sidebar — fixed height, no scroll */}
      <div className="hidden md:flex h-full">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 h-full">
            <Sidebar collapsed={false} onToggle={() => {}} onClose={() => setMobileOpen(false)} mobile />
          </div>
        </div>
      )}

      {/* Right column: top bar + scrollable content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onMobileMenu={() => setMobileOpen(true)} />

        {/* Health banners */}
        {health === 'checking' && (
          <div className="bg-amber-500/10 text-amber-600 dark:text-amber-300 text-xs px-5 py-2 flex items-center gap-2 shrink-0" style={{ borderBottom: '1px solid rgba(245,158,11,0.2)' }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Connecting to server… may take up to 30s (Render free tier)
          </div>
        )}
        {health === 'unreachable' && (
          <div className="bg-red-500/10 text-red-500 text-xs px-5 py-2 shrink-0" style={{ borderBottom: '1px solid rgba(239,68,68,0.2)' }}>
            Server unavailable. Please reload the page.
          </div>
        )}

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 max-w-[1400px] w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ── Login ───────────────────────────────────────────── */
function LoginPage() {
  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
  const error = new URLSearchParams(window.location.search).get('error');
  const { theme, toggle } = useThemeStore();

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--c-page)' }}>
      <button
        onClick={toggle}
        className="fixed top-4 right-4 w-9 h-9 flex items-center justify-center rounded-lg transition-all"
        style={{ border: '1px solid var(--c-border)', backgroundColor: 'var(--c-card)', color: 'var(--c-ink2)' }}
      >
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>

      <div className="text-center space-y-8 max-w-sm w-full">
        <div className="space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-strava-orange flex items-center justify-center mx-auto text-white">
            <StravaLogo size={32} />
          </div>
          <h1 className="text-3xl font-bold text-c-ink">Strava Analytics</h1>
          <p className="text-sm" style={{ color: 'var(--c-ink2)' }}>Sports Performance Analytics Platform</p>
        </div>

        {error && (
          <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
            Auth error: {error}. Please try again.
          </div>
        )}

        <a
          href={`${apiUrl}/auth/strava`}
          className="inline-flex items-center gap-3 px-8 py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-100"
          style={{ background: '#FC4C02' }}
        >
          <StravaLogo size={20} />
          Connect with Strava
        </a>

        <p className="text-xs" style={{ color: 'var(--c-ink3)' }}>Read-only access. Your data stays private.</p>
      </div>
    </div>
  );
}

/* ── OAuth callback ──────────────────────────────────── */
function OAuthCallback() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const rawHash = location.hash || window.location.hash;
    const hash = rawHash.startsWith('#') ? rawHash.slice(1) : rawHash;
    if (!hash) { navigate('/', { replace: true }); return; }

    const params = new URLSearchParams(hash);
    const token = params.get('token');
    const athleteId = params.get('athlete_id');
    const firstname = params.get('firstname') ?? '';
    const lastname = params.get('lastname') ?? '';
    const profilePhoto = params.get('photo') ?? null;

    if (token && athleteId) {
      login({ access_token: token, athlete_id: Number(athleteId), firstname, lastname, profilePhoto });
      navigate('/strategic', { replace: true });
    } else {
      navigate('/?error=missing_token', { replace: true });
    }
  }, [location.hash, login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--c-page)', color: 'var(--c-ink)' }}>
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: '#FC4C02', borderTopColor: 'transparent' }} />
        <p className="text-sm" style={{ color: 'var(--c-ink2)' }}>Authenticating…</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/callback" element={<OAuthCallback />} />
          <Route path="/strategic" element={<ProtectedRoute><StrategicDashboard /></ProtectedRoute>} />
          <Route path="/tactical" element={<ProtectedRoute><TacticalDashboard /></ProtectedRoute>} />
          <Route path="/operational" element={<ProtectedRoute><OperationalDashboard /></ProtectedRoute>} />
          <Route path="/activities/:id" element={<ProtectedRoute><ActivityDetailPage /></ProtectedRoute>} />
          <Route path="/ml" element={<ProtectedRoute><MLDashboard /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
