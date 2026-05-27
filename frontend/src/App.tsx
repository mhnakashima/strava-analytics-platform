import React, { useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useThemeStore } from './store/useThemeStore';
import { useLanguageStore } from './store/useLanguageStore';
import { useBackendHealth } from './hooks/useBackendHealth';
import { useT } from './hooks/useTranslation';
import MLDashboard from './pages/ml/MLDashboard';
import OperationalDashboard from './pages/operational/OperationalDashboard';
import ActivityDetailPage from './pages/activity/ActivityDetailPage';
import StrategicDashboard from './pages/strategic/StrategicDashboard';
import TacticalDashboard from './pages/tactical/TacticalDashboard';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: (active: boolean) => React.ReactNode;
};

function useNavItems(): NavItem[] {
  const t = useT();
  return [
  {
    href: '/strategic',
    label: t.nav.strategic,
    shortLabel: t.nav.shortStrategic,
    icon: (active: boolean) => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    href: '/tactical',
    label: t.nav.tactical,
    shortLabel: t.nav.shortTactical,
    icon: (_active: boolean) => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    href: '/operational',
    label: t.nav.operational,
    shortLabel: t.nav.shortOperational,
    icon: (_active: boolean) => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    href: '/ml',
    label: t.nav.ml,
    shortLabel: t.nav.shortMl,
    icon: (_active: boolean) => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><circle cx="12" cy="2" r="1" /><circle cx="12" cy="22" r="1" />
        <circle cx="2" cy="12" r="1" /><circle cx="22" cy="12" r="1" />
        <line x1="12" y1="5" x2="12" y2="9" /><line x1="12" y1="15" x2="12" y2="19" />
        <line x1="5" y1="12" x2="9" y2="12" /><line x1="15" y1="12" x2="19" y2="12" />
      </svg>
    ),
  },
  ];
}

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
const StravaLogo = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066z"/>
    <path d="M10.232 13.828L7.648 8.818H5L10.232 19 12.8 13.828z"/>
  </svg>
);

/* ── Desktop Sidebar ─────────────────────────────────── */
interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const isCollapsed = collapsed;
  const NAV_ITEMS = useNavItems();

  return (
    <aside
      style={{ backgroundColor: 'var(--c-card)', boxShadow: '1px 0 0 0 var(--c-border)' }}
      className={`
        flex flex-col h-full transition-[width] duration-200 ease-in-out overflow-hidden shrink-0
        ${isCollapsed ? 'w-[56px]' : 'w-56'}
      `}
    >
      <div
        className={`flex items-center shrink-0 h-14 ${isCollapsed ? 'justify-center' : 'px-4 gap-3'}`}
        style={{ backgroundColor: 'var(--c-card)' }}
      >
        <button
          onClick={isCollapsed ? onToggle : undefined}
          className={`w-7 h-7 rounded-lg bg-strava-orange flex items-center justify-center shrink-0 text-white
            ${isCollapsed ? 'cursor-pointer hover:brightness-90 transition-all' : 'cursor-default'}`}
          title={isCollapsed ? 'Expand sidebar' : undefined}
          tabIndex={isCollapsed ? 0 : -1}
        >
          <StravaLogo size={16} />
        </button>
        {!isCollapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-tight truncate" style={{ color: 'var(--c-ink)' }}>Strava Analytics</p>
              <p className="text-[11px] truncate" style={{ color: 'var(--c-ink3)' }}>Performance Platform</p>
            </div>
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
          </>
        )}
      </div>

      <nav
        className="flex-1 px-2 py-3 space-y-0.5"
        style={{ backgroundColor: 'var(--c-card)' }}
      >
        {!isCollapsed && (
          <p className="px-2 mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--c-ink3)' }}>
            Dashboards
          </p>
        )}
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            title={isCollapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm font-medium transition-all relative group
              ${isCollapsed ? 'justify-center' : ''}
              ${isActive ? 'bg-c-subtle text-c-ink' : 'text-c-ink2 hover:text-c-ink hover:bg-c-subtle/60'}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && !isCollapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-strava-orange rounded-r-full" />
                )}
                <span style={{ color: isActive ? '#FC4C02' : undefined }} className={!isActive ? 'text-c-ink3 group-hover:text-c-ink2 transition-colors' : ''}>
                  {item.icon(isActive)}
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

/* ── Mobile Bottom Tab Bar ───────────────────────────── */
function BottomTabBar() {
  const NAV_ITEMS = useNavItems();
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 flex md:hidden"
      style={{
        backgroundColor: 'var(--c-card)',
        borderTop: '1px solid var(--c-border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all"
          style={({ isActive }) => ({
            color: isActive ? '#FC4C02' : 'var(--c-ink3)',
          })}
        >
          {({ isActive }) => (
            <>
              {item.icon(isActive)}
              <span className="text-[10px] font-medium leading-tight">{item.shortLabel}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

/* ── Top Bar ─────────────────────────────────────────── */
function TopBar() {
  const { firstname, lastname, profilePhoto, logout } = useAuthStore();
  const { theme, toggle: toggleTheme } = useThemeStore();
  const { lang, toggle: toggleLang } = useLanguageStore();
  const t = useT();
  const initials = `${firstname?.[0] ?? ''}${lastname?.[0] ?? ''}`.toUpperCase();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header
      className="sticky top-0 z-30 flex items-center px-4 md:px-6 h-14 shrink-0"
      style={{ backgroundColor: 'var(--c-card)', boxShadow: '0 1px 0 var(--c-border)' }}
    >
      {/* Mobile: logo (no hamburger needed) */}
      <div className="md:hidden flex items-center gap-2 mr-auto">
        <div className="w-6 h-6 rounded-md bg-strava-orange flex items-center justify-center text-white">
          <StravaLogo size={13} />
        </div>
        <span className="font-bold text-sm" style={{ color: 'var(--c-ink)' }}>Strava Analytics</span>
      </div>

      {/* Desktop spacer */}
      <div className="hidden md:block flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Language toggle */}
        <button
          onClick={toggleLang}
          title={lang === 'en' ? 'Switch to Portuguese' : 'Mudar para Inglês'}
          className="h-8 px-2.5 flex items-center rounded-lg text-xs font-bold tracking-wider transition-all"
          style={{ color: 'var(--c-ink2)', border: '1px solid var(--c-border)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--c-subtle)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}
        >
          <span style={{ color: lang === 'en' ? '#FC4C02' : 'var(--c-ink3)' }}>EN</span>
          <span className="mx-1" style={{ color: 'var(--c-border)' }}>|</span>
          <span style={{ color: lang === 'pt' ? '#FC4C02' : 'var(--c-ink3)' }}>PT</span>
        </button>

        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? t.topbar.lightMode : t.topbar.darkMode}
          className="w-9 h-9 flex items-center justify-center rounded-lg transition-all"
          style={{ color: 'var(--c-ink2)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--c-subtle)'; (e.currentTarget as HTMLElement).style.color = 'var(--c-ink)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; (e.currentTarget as HTMLElement).style.color = 'var(--c-ink2)'; }}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((s) => !s)}
            className="flex items-center gap-2 pl-1 pr-2 py-1.5 rounded-lg transition-all"
            style={{ backgroundColor: menuOpen ? 'var(--c-subtle)' : '' }}
            onMouseEnter={e => { if (!menuOpen) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--c-subtle)'; }}
            onMouseLeave={e => { if (!menuOpen) (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}
          >
            {profilePhoto ? (
              <img src={profilePhoto} alt={firstname ?? ''} className="w-7 h-7 rounded-full object-cover border-2" style={{ borderColor: 'var(--c-border)' }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'rgba(252,76,2,0.15)', border: '1px solid rgba(252,76,2,0.3)' }}>
                <span className="text-[10px] font-bold" style={{ color: '#FC4C02' }}>{initials || '?'}</span>
              </div>
            )}
            <span className="hidden md:block text-sm font-medium" style={{ color: 'var(--c-ink)' }}>{firstname}</span>
            <span style={{ color: 'var(--c-ink3)' }}><ChevronDown /></span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl py-1 z-50"
              style={{ backgroundColor: 'var(--c-card)', border: '1px solid var(--c-border)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
              <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--c-border)' }}>
                <div className="flex items-center gap-3">
                  {profilePhoto
                    ? <img src={profilePhoto} alt="" className="w-9 h-9 rounded-full object-cover" />
                    : <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(252,76,2,0.15)', border: '1px solid rgba(252,76,2,0.3)' }}>
                        <span className="text-xs font-bold" style={{ color: '#FC4C02' }}>{initials}</span>
                      </div>}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--c-ink)' }}>{firstname} {lastname}</p>
                    <p className="text-xs" style={{ color: 'var(--c-ink3)' }}>{t.topbar.athlete}</p>
                  </div>
                </div>
              </div>
              <div className="py-1">
                <button onClick={() => { setMenuOpen(false); toggleTheme(); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-all"
                  style={{ color: 'var(--c-ink2)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--c-subtle)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}>
                  {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                  {theme === 'dark' ? t.topbar.lightMode : t.topbar.darkMode}
                </button>
                <button onClick={() => { setMenuOpen(false); logout(); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-all"
                  style={{ color: '#ef4444' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(239,68,68,0.08)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  {t.topbar.signOut}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function HealthBanner({ type }: { type: 'checking' | 'unreachable' }) {
  const t = useT();
  if (type === 'checking') return (
    <div className="text-xs px-5 py-2 flex items-center gap-2 shrink-0"
      style={{ backgroundColor: 'rgba(245,158,11,0.08)', borderBottom: '1px solid rgba(245,158,11,0.2)', color: '#d97706' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
      {t.common.connectServer}
    </div>
  );
  return (
    <div className="text-xs px-5 py-2 shrink-0"
      style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
      {t.common.serverUnavailable}
    </div>
  );
}

/* ── Layout ──────────────────────────────────────────── */
function Layout({ children }: { children: React.ReactNode }) {
  const health = useBackendHealth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: 'var(--c-page)', color: 'var(--c-ink)' }}>

      {/* Desktop sidebar only */}
      <div className="hidden md:flex h-full" style={{ backgroundColor: 'var(--c-card)' }}>
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      </div>

      {/* Right column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />

        {health === 'checking' && (
          <HealthBanner type="checking" />
        )}
        {health === 'unreachable' && (
          <HealthBanner type="unreachable" />
        )}

        {/* Scrollable content — pb-20 on mobile to clear the bottom tab bar */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="p-4 md:p-6 max-w-[1400px] w-full mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <BottomTabBar />
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
      <button onClick={toggle} className="fixed top-4 right-4 w-9 h-9 flex items-center justify-center rounded-lg transition-all"
        style={{ border: '1px solid var(--c-border)', backgroundColor: 'var(--c-card)', color: 'var(--c-ink2)' }}>
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>

      <div className="text-center space-y-8 max-w-sm w-full">
        <div className="space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-strava-orange flex items-center justify-center mx-auto text-white">
            <StravaLogo size={32} />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--c-ink)' }}>Strava Analytics</h1>
          <p className="text-sm" style={{ color: 'var(--c-ink2)' }}>Sports Performance Analytics Platform</p>
        </div>

        {error && (
          <div className="rounded-lg px-4 py-3 text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
            Auth error: {error}. Please try again.
          </div>
        )}

        <a href={`${apiUrl}/auth/strava`}
          className="inline-flex items-center gap-3 px-8 py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-100"
          style={{ background: '#FC4C02' }}>
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
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto"
          style={{ borderColor: '#FC4C02', borderTopColor: 'transparent' }} />
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
          <Route path="/strategic"   element={<ProtectedRoute><StrategicDashboard /></ProtectedRoute>} />
          <Route path="/tactical"    element={<ProtectedRoute><TacticalDashboard /></ProtectedRoute>} />
          <Route path="/operational" element={<ProtectedRoute><OperationalDashboard /></ProtectedRoute>} />
          <Route path="/activities/:id" element={<ProtectedRoute><ActivityDetailPage /></ProtectedRoute>} />
          <Route path="/ml"          element={<ProtectedRoute><MLDashboard /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
