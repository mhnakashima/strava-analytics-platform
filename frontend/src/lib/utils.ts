import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Converte segundos/km para string "mm:ss /km" */
export function formatPace(secPerKm: number | null | undefined): string {
  if (!secPerKm) return '—';
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60);
  return `${min}:${sec.toString().padStart(2, '0')} /km`;
}

/** Converte segundos para "HH:mm:ss" */
export function formatDuration(sec: number | null | undefined): string {
  if (!sec) return '—';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

export function formatDistance(km: number | null | undefined): string {
  if (!km) return '—';
  return `${km.toFixed(2)} km`;
}

export function clusterColor(label: string | null | undefined): string {
  switch (label) {
    case 'leve': return '#22c55e';
    case 'moderado': return '#f59e0b';
    case 'intenso': return '#ef4444';
    default: return '#6b7280';
  }
}
