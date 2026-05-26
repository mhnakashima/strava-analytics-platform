import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useBackendHealth } from './hooks/useBackendHealth';
import MLDashboard from './pages/ml/MLDashboard';
import OperationalDashboard from './pages/operational/OperationalDashboard';
import StrategicDashboard from './pages/strategic/StrategicDashboard';
import TacticalDashboard from './pages/tactical/TacticalDashboard';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function Layout({ children }: { children: React.ReactNode }) {
  const { firstname, lastname, logout } = useAuthStore();
  const health = useBackendHealth();

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      <aside className="w-56 bg-gray-950 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <span className="text-strava-orange font-bold text-lg">Strava Analytics</span>
          <p className="text-xs text-gray-500 mt-1">{firstname} {lastname}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {[
            { href: '/strategic', label: 'Estratégico' },
            { href: '/tactical', label: 'Tático' },
            { href: '/operational', label: 'Operacional' },
            { href: '/ml', label: 'Machine Learning' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-800">
          <button
            onClick={logout}
            className="w-full text-left text-xs text-gray-500 hover:text-gray-300 transition-colors px-3 py-2"
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-auto">
        {health === 'checking' && (
          <div className="bg-yellow-900/60 text-yellow-300 text-xs px-4 py-2 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            Conectando ao servidor… pode levar até 30s (Render free tier)
          </div>
        )}
        {health === 'unreachable' && (
          <div className="bg-red-900/60 text-red-300 text-xs px-4 py-2">
            Servidor indisponível. Tente recarregar a página.
          </div>
        )}
        <div className="flex-1 p-6">{children}</div>
      </main>
    </div>
  );
}

function LoginPage() {
  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
  const error = new URLSearchParams(window.location.search).get('error');

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-white">Strava Analytics</h1>
        <p className="text-gray-400">Plataforma de Analytics para Performance Esportiva</p>
        {error && (
          <p className="text-red-400 text-sm">Erro ao autenticar: {error}. Tente novamente.</p>
        )}
        <a
          href={`${apiUrl}/auth/strava`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: '#FC4C02' }}
        >
          Conectar com Strava
        </a>
      </div>
    </div>
  );
}

// Reads the JWT from the URL fragment after the OAuth redirect and stores it.
// The backend redirects to: /#token=xxx&athlete_id=1&firstname=John&lastname=Doe
function OAuthCallback() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // React Router's location.hash is the authoritative source inside BrowserRouter
    const rawHash = location.hash || window.location.hash;
    const hash = rawHash.startsWith('#') ? rawHash.slice(1) : rawHash;

    console.debug('[OAuthCallback] hash:', hash || '(empty)');

    if (!hash) {
      console.warn('[OAuthCallback] No hash found, redirecting to /');
      navigate('/', { replace: true });
      return;
    }

    const params = new URLSearchParams(hash);
    const token = params.get('token');
    const athleteId = params.get('athlete_id');
    const firstname = params.get('firstname') ?? '';
    const lastname = params.get('lastname') ?? '';

    console.debug('[OAuthCallback] token:', token ? `${token.slice(0, 20)}…` : 'null');
    console.debug('[OAuthCallback] athleteId:', athleteId);

    if (token && athleteId) {
      login({ access_token: token, athlete_id: Number(athleteId), firstname, lastname });
      navigate('/strategic', { replace: true });
    } else {
      console.error('[OAuthCallback] Missing token or athleteId in hash');
      navigate('/?error=missing_token', { replace: true });
    }
  }, [location.hash, login, navigate]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white text-lg">
      Autenticando…
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
