import { useEffect, useState } from 'react';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const MAX_ATTEMPTS = 10;
const INTERVAL_MS = 3000;

export type HealthStatus = 'checking' | 'ok' | 'unreachable';

export function useBackendHealth(): HealthStatus {
  const [status, setStatus] = useState<HealthStatus>('checking');

  useEffect(() => {
    let attempts = 0;
    let cancelled = false;

    const ping = async () => {
      try {
        await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
        if (!cancelled) setStatus('ok');
      } catch {
        attempts += 1;
        if (attempts >= MAX_ATTEMPTS) {
          if (!cancelled) setStatus('unreachable');
          return;
        }
        if (!cancelled) setTimeout(ping, INTERVAL_MS);
      }
    };

    ping();
    return () => { cancelled = true; };
  }, []);

  return status;
}
