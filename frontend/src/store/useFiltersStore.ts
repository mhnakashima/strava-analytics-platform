import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Filters } from '../types';

interface FiltersStore {
  filters: Filters;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  resetFilters: () => void;
  toQueryParams: () => Record<string, string | number>;
}

const DEFAULT_FILTERS: Filters = {
  startDate: null,
  endDate: null,
  activityType: null,
  intensity: null,
  minDistanceKm: null,
  maxDistanceKm: null,
};

export const useFiltersStore = create<FiltersStore>()(
  persist(
    (set, get) => ({
      filters: DEFAULT_FILTERS,

      setFilter: (key, value) =>
        set((state) => ({ filters: { ...state.filters, [key]: value } })),

      resetFilters: () => set({ filters: DEFAULT_FILTERS }),

      toQueryParams: () => {
        const f = get().filters;
        const params: Record<string, string | number> = {};
        if (f.startDate) params.start_date = f.startDate;
        if (f.endDate) params.end_date = f.endDate;
        if (f.activityType) params.activity_type = f.activityType;
        if (f.intensity) params.intensity = f.intensity;
        if (f.minDistanceKm) params.min_distance_km = f.minDistanceKm;
        if (f.maxDistanceKm) params.max_distance_km = f.maxDistanceKm;
        return params;
      },
    }),
    { name: 'filters-storage' }
  )
);
