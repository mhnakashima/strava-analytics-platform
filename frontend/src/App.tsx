import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useThemeStore } from './store/useThemeStore';
import { useBackendHealth } from './hooks/useBackendHealth';
import MLDashboard from './pages/ml/MLDashboard';
import OperationalDashboard from './pages/operational/OperationalDashboard';
import StrategicDashboard from './pages/strategic/StrategicDashboard';
import TacticalDashboard from './pages/tactical/TacticalDashboard';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

const NAV_ITEMS = [
  {
    href: '/strategic',
    label: 'Estratégico',
    sublabel: 'KPIs & Pace',
    icon: (
      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    href: '/tactical',
    label: 'Tático',
    sublabel: 'Zonas & Volume',
    icon: (
      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    href: '/operational',
    label: 'Operacional',
    sublabel: 'Atividades',
    icon: (
      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    href: '/ml',
    label: 'Machine Learning',
    sublabel: 'Clustering',
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

// Sun icon
const SunIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

// Moon icon
const MoonIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

// Chevron icons
const ChevronLeft = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const ChevronRight = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <polyline points="9 18 15 12 9 6" />
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

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onClose?: () => void;
  mobile?: boolean;
}

function Sidebar({ collapsed, onToggle, onClose, mobile }: SidebarProps) {
  const { firstname, lastname, logout } = useAuthStore();
  const { theme, toggle: toggleTheme } = useThemeStore();
  const initials = `${firstname?.[0] ?? ''}${lastname?.[0] ?? ''}`.toUpperCase();

  return (
    <aside
      className={`
        flex flex-col bg-c-card border-r border-c-border h-full
        transition-all duration-200 ease-in-out overflow-hidden
        ${collapsed && !mobile ? 'w-[60px]' : 'w-60'}
      `}
    >
      {/* Logo + collapse toggle */}
      <div className={`flex items-center border-b border-c-border shrink-0 ${collapsed && !mobile ? 'px-3 py-4 justify-center' : 'px-4 py-4 gap-3'}`}>
        <div className="w-7 h-7 rounded-lg bg-strava-orange flex items-center justify-center shrink-0 text-white">
          <StravaLogo size={16} />
        </div>
        {(!collapsed || mobile) && (
          <div className="flex-1 min-w-0">
            <p className="text-c-ink font-bold text-sm leading-tight truncate">Strava Analytics</p>
            <p className="text-c-ink3 text-[11px] truncate">Performance Platform</p>
          </div>
        )}
        {/* Collapse toggle (desktop only) */}
        {!mobile && (
          <button
            onClick={onToggle}
            className={`flex items-center justify-center w-6 h-6 rounded-md text-c-ink3 hover:text-c-ink hover:bg-c-subtle transition-all shrink-0 ${collapsed ? 'mx-auto' : ''}`}
            title={collapsed ? 'Expandir' : 'Recolher'}
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </button>
        )}
        {/* Close on mobile */}
        {mobile && onClose && (
          <button onClick={onClose} className="ml-auto w-7 h-7 flex items-center justify-center rounded-md text-c-ink2 hover:text-c-ink hover:bg-c-subtle transition-all">
            <CloseIcon />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {(!collapsed || mobile) && (
          <p className="px-3 mb-2 text-[10px] font-bold text-c-ink3 uppercase tracking-widest">Dashboards</p>
        )}
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={mobile ? onClose : undefined}
            title={collapsed && !mobile ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative group ${
                isActive
                  ? 'text-c-ink bg-c-subtle'
                  : 'text-c-ink2 hover:text-c-ink hover:bg-c-subtle/60'
              } ${collapsed && !mobile ? 'justify-center' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-strava-orange rounded-full" />
                )}
                <span className={`shrink-0 ${isActive ? 'text-strava-orange' : 'text-c-ink3 group-hover:text-c-ink2 transition-colors'}`}>
                  {item.icon}
                </span>
                {(!collapsed || mobile) && (
                  <span className="truncate">{item.label}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer: theme + user */}
      <div className="px-2 py-3 border-t border-c-border space-y-1 shrink-0">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-c-ink2 hover:text-c-ink hover:bg-c-subtle transition-all ${collapsed && !mobile ? 'justify-center' : ''}`}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          {(!collapsed || mobile) && (
            <span className="truncate">{theme === 'dark' ? 'Modo claro' : 'Modo escuro'}</span>
          )}
        </button>

        {/* User */}
        <div className={`flex items-center gap-3 px-3 py-2 ${collapsed && !mobile ? 'justify-center' : ''}`}>
          <div
            className="w-7 h-7 rounded-full bg-strava-orange/15 border border-strava-orange/30 flex items-center justify-center shrink-0 cursor-pointer"
            onClick={logout}
            title="Sair"
          >
            <span className="text-[10px] font-bold text-strava-orange">{initials || '?'}</span>
          </div>
          {(!collapsed || mobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-c-ink truncate">{firstname} {lastname}</p>
              <button onClick={logout} className="text-[10px] text-c-ink3 hover:text-c-ink2 transition-colors">
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const health = useBackendHealth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  const location = useLocation();
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Close mobile sidebar on resize to desktop
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <div className="min-h-screen bg-c-page text-c-ink flex">
      {/* Desktop sidebar */}
      <div className="hidden md:flex shrink-0">
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

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-auto">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-c-border bg-c-card sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-c-ink2 hover:text-c-ink hover:bg-c-subtle transition-all"
          >
            <MenuIcon />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-strava-orange flex items-center justify-center text-white">
              <StravaLogo size={12} />
            </div>
            <span className="text-c-ink font-bold text-sm">Strava Analytics</span>
          </div>
        </div>

        {/* Health banners */}
        {health === 'checking' && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-300 text-xs px-5 py-2.5 flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Conectando ao servidor… pode levar até 30s (Render free tier)
          </div>
        )}
        {health === 'unreachable' && (
          <div className="bg-red-500/10 border-b border-red-500/20 text-red-600 dark:text-red-300 text-xs px-5 py-2.5">
            Servidor indisponível. Tente recarregar a página.
          </div>
        )}

        <div className="flex-1 p-4 md:p-6 max-w-[1400px] w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

function LoginPage() {
  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
  const error = new URLSearchParams(window.location.search).get('error');
  const { theme, toggle } = useThemeStore();

  return (
    <div className="min-h-screen bg-c-page flex items-center justify-center p-4">
      {/* Theme toggle top-right */}
      <button
        onClick={toggle}
        className="fixed top-4 right-4 w-9 h-9 flex items-center justify-center rounded-lg border border-c-border bg-c-card text-c-ink2 hover:text-c-ink transition-all"
      >
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>

      <div className="text-center space-y-8 max-w-sm w-full">
        <div className="space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-strava-orange flex items-center justify-center mx-auto text-white">
            <StravaLogo size={32} />
          </div>
          <h1 className="text-3xl font-bold text-c-ink">Strava Analytics</h1>
          <p className="text-c-ink2 text-sm">Plataforma de Analytics para Performance Esportiva</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-500 dark:text-red-400 text-sm">
            Erro ao autenticar: {error}. Tente novamente.
          </div>
        )}

        <a
          href={`${apiUrl}/auth/strava`}
          className="inline-flex items-center gap-3 px-8 py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-100"
          style={{ background: '#FC4C02' }}
        >
          <StravaLogo size={20} />
          Conectar com Strava
        </a>

        <p className="text-xs text-c-ink3">Acesso apenas leitura. Seus dados ficam seguros.</p>
      </div>
    </div>
  );
}

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

    if (token && athleteId) {
      login({ access_token: token, athlete_id: Number(athleteId), firstname, lastname });
      navigate('/strategic', { replace: true });
    } else {
      navigate('/?error=missing_token', { replace: true });
    }
  }, [location.hash, login, navigate]);

  return (
    <div className="min-h-screen bg-c-page flex items-center justify-center text-c-ink">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-2 border-strava-orange border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-c-ink2 text-sm">Autenticando…</p>
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
          <Route path="/ml" element={<ProtectedRoute><MLDashboard /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
