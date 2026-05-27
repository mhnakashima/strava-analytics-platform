export interface Activity {
  activity_id: number;
  strava_name: string | null;
  start_date: string | null;
  activity_type: string | null;
  distance_km: number | null;
  moving_time_sec: number | null;
  avg_pace_sec_km: number | null;
  avg_heartrate: number | null;
  elevation_gain_m: number | null;
  cluster_label: 'leve' | 'moderado' | 'intenso' | null;
}

export interface ActivityDetail extends Activity {
  elapsed_time_sec: number | null;
  max_heartrate: number | null;
  calories: number | null;
  training_load: number | null;
  kudos_count: number;
  hr_zone_1_pct: number | null;
  hr_zone_2_pct: number | null;
  hr_zone_3_pct: number | null;
  hr_zone_4_pct: number | null;
  hr_zone_5_pct: number | null;
  best_pace_sec_km: number | null;
}

export interface ActivityKPIs {
  total_distance_km: number;
  total_activities: number;
  avg_pace_sec_km: number | null;
  best_pace_sec_km: number | null;
  avg_heartrate: number | null;
  total_elevation_m: number;
  total_calories: number;
  consistency_per_week: number;
  avg_training_load: number | null;
}

export interface TimelinePoint {
  date: string;
  distance_km: number;
  avg_pace_sec_km: number | null;
  avg_heartrate: number | null;
  training_load: number | null;
}

export interface HRZoneDistribution {
  zone_1_pct: number;
  zone_2_pct: number;
  zone_3_pct: number;
  zone_4_pct: number;
  zone_5_pct: number;
}

export interface ClusterPoint {
  activity_id: number;
  start_date: string | null;
  avg_pace_sec_km: number | null;
  distance_km: number | null;
  avg_heartrate: number | null;
  elevation_gain_m: number | null;
  cluster_label: string | null;
}

export interface TrainingProfile {
  leve_pct: number;
  moderado_pct: number;
  intenso_pct: number;
  dominant_cluster: string;
}

export interface BestEffort {
  label: string;
  min_distance_km: number;
  best_pace_sec_km: number | null;
  best_time_sec: number | null;
  activity_date: string | null;
  activity_name: string | null;
}

export interface BestTimes {
  efforts: BestEffort[];
}

export interface ClusterStat {
  label: 'leve' | 'moderado' | 'intenso';
  count: number;
  avg_pace_sec_km: number | null;
  avg_distance_km: number | null;
  avg_heartrate: number | null;
  avg_elevation_m: number | null;
  avg_training_load: number | null;
}

export interface ClusterTrendPoint {
  week: string;
  easy: number;
  moderate: number;
  hard: number;
}

export type ReadinessLevel = 'peak' | 'fresh' | 'moderate' | 'tired' | 'rest';

export interface TrainingReadiness {
  atl: number;
  ctl: number;
  tsb: number;
  weekly_trimp: number;
  monthly_trimp: number;
  days_since_last: number | null;
  last_activity_date: string | null;
  readiness_level: ReadinessLevel;
  readiness_title: string;
  readiness_advice: string;
  readiness_color: string;
  readiness_icon: string;
}

export interface Filters {
  startDate: string | null;
  endDate: string | null;
  activityType: string | null;
  intensity: string | null;
  minDistanceKm: number | null;
  maxDistanceKm: number | null;
}

export interface AuthState {
  accessToken: string | null;
  athleteId: number | null;
  firstname: string | null;
  lastname: string | null;
}
