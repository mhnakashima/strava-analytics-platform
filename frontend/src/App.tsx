import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
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
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    href: '/tactical',
    label: 'Tático',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    href: '/operational',
    label: 'Operacional',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    href: '/ml',
    label: 'Machine Learning',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><circle cx="12" cy="2" r="1" /><circle cx="12" cy="22" r="1" />
        <circle cx="2" cy="12" r="1" /><circle cx="22" cy="12" r="1" />
        <line x1="12" y1="5" x2="12" y2="9" /><line x1="12" y1="15" x2="12" y2="19" />
        <line x1="5" y1="12" x2="9" y2="12" /><line x1="15" y1="12" x2="19" y2="12" />
      </svg>
    ),
  },
];

function Layout({ children }: { children: React.ReactNode }) {
  const { firstname, lastname, logout } = useAuthStore();
  const health = useBackendHealth();
  const initials = `${firstname?.[0] ?? ''}${lastname?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      <aside className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-strava-orange flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066z"/>
                <path d="M10.232 13.828L7.648 8.818H5L10.232 19 12.8 13.828z"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Strava Analytics</p>
              <p className="text-gray-500 text-xs">Performance Platform</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="px-3 mb-2 text-[10px] font-semibold text-gray-600 uppercase tracking-widest">Dashboards</p>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                isActive
                  ? 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white bg-gray-800 relative group'
                  : 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800/60 transition-all group'
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-strava-orange rounded-full" />
                  )}
                  <span className={isActive ? 'text-strava-orange' : 'text-gray-500 group-hover:text-gray-300 transition-colors'}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 pb-4 border-t border-gray-800 pt-4">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-strava-orange/20 border border-strava-orange/30 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-strava-orange">{initials || '?'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{firstname} {lastname}</p>
              <button
                onClick={logout}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-auto">
        {health === 'checking' && (
          <div className="bg-amber-900/40 border-b border-amber-800/40 text-amber-300 text-xs px-5 py-2.5 flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Conectando ao servidor… pode levar até 30s (Render free tier)
          </div>
        )}
        {health === 'unreachable' && (
          <div className="bg-red-900/40 border-b border-red-800/40 text-red-300 text-xs px-5 py-2.5">
            Servidor indisponível. Tente recarregar a página.
          </div>
        )}
        <div className="flex-1 p-6 max-w-[1400px] w-full mx-auto">{children}</div>
      </main>
    </div>
  );
}

function LoginPage() {
  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
  const error = new URLSearchParams(window.location.search).get('error');

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-md w-full">
        <div className="space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-strava-orange flex items-center justify-center mx-auto">
            <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066z"/>
              <path d="M10.232 13.828L7.648 8.818H5L10.232 19 12.8 13.828z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Strava Analytics</h1>
          <p className="text-gray-400 text-sm">Plataforma de Analytics para Performance Esportiva</p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700/50 rounded-lg px-4 py-3 text-red-400 text-sm">
            Erro ao autenticar: {error}. Tente novamente.
          </div>
        )}

        <a
          href={`${apiUrl}/auth/strava`}
          className="inline-flex items-center gap-3 px-8 py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90 hover:scale-105 active:scale-100"
          style={{ background: '#FC4C02' }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066z"/>
            <path d="M10.232 13.828L7.648 8.818H5L10.232 19 12.8 13.828z"/>
          </svg>
          Conectar com Strava
        </a>

        <p className="text-xs text-gray-600">Seus dados ficam seguros. Acesso apenas leitura.</p>
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

    if (!hash) {
      navigate('/', { replace: true });
      return;
    }

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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-2 border-strava-orange border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-400 text-sm">Autenticando…</p>
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
