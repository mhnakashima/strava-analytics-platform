import { useQuery } from '@tanstack/react-query';
import { activitiesApi, analyticsApi } from '../services/api';
import type { Activity, ActivityKPIs, BestTimes, ClusterPoint, HRZoneDistribution, TimelinePoint, TrainingProfile } from '../types';

export function useActivities(params?: Record<string, unknown>) {
  return useQuery<Activity[]>({
    queryKey: ['activities', params],
    queryFn: () => activitiesApi.list(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useActivityKPIs(params?: Record<string, unknown>) {
  return useQuery<ActivityKPIs>({
    queryKey: ['activity-kpis', params],
    queryFn: () => activitiesApi.summary(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTimeline(params?: Record<string, unknown>) {
  return useQuery<TimelinePoint[]>({
    queryKey: ['timeline', params],
    queryFn: () => activitiesApi.timeline(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useHRZones(params?: Record<string, unknown>) {
  return useQuery<HRZoneDistribution>({
    queryKey: ['hr-zones', params],
    queryFn: () => analyticsApi.heartrate(params),
    staleTime: 10 * 60 * 1000,
  });
}

export function useClusterPoints() {
  return useQuery<ClusterPoint[]>({
    queryKey: ['cluster-points'],
    queryFn: analyticsApi.clusters,
    staleTime: 10 * 60 * 1000,
  });
}

export function useTrainingProfile() {
  return useQuery<TrainingProfile>({
    queryKey: ['training-profile'],
    queryFn: analyticsApi.trainingProfile,
    staleTime: 10 * 60 * 1000,
  });
}

export function useBestTimes() {
  return useQuery<BestTimes>({
    queryKey: ['best-times'],
    queryFn: analyticsApi.bestTimes,
    staleTime: 30 * 60 * 1000,
  });
}

export function useLastActivity() {
  return useQuery<Activity>({
    queryKey: ['last-activity'],
    queryFn: analyticsApi.lastActivity,
    staleTime: 10 * 60 * 1000,
  });
}
