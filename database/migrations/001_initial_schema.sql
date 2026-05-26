-- ============================================================
-- Strava Analytics Platform — Initial Schema
-- ============================================================

-- ── Dimensão de datas ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dim_date (
    date_id      INT PRIMARY KEY,  -- formato YYYYMMDD
    full_date    DATE NOT NULL,
    year         SMALLINT NOT NULL,
    quarter      SMALLINT NOT NULL,
    month        SMALLINT NOT NULL,
    week_of_year SMALLINT NOT NULL,
    day_of_week  SMALLINT NOT NULL, -- 0=Domingo, 6=Sábado
    is_weekend   BOOLEAN NOT NULL,
    season       VARCHAR(20)
);

-- ── Dimensão de atletas ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS dim_athlete (
    athlete_id               BIGSERIAL PRIMARY KEY,
    strava_id                BIGINT UNIQUE NOT NULL,
    firstname                VARCHAR(100),
    lastname                 VARCHAR(100),
    city                     VARCHAR(100),
    country                  VARCHAR(100),
    weight_kg                FLOAT,
    max_heartrate            INT,
    ftp                      INT,
    strava_access_token      VARCHAR(255),
    strava_refresh_token     VARCHAR(255),
    strava_token_expires_at  INT,
    created_at               TIMESTAMP DEFAULT NOW(),
    updated_at               TIMESTAMP DEFAULT NOW()
);

-- ── Dimensão de tipo de atividade ────────────────────────────
CREATE TABLE IF NOT EXISTS dim_activity_type (
    activity_type_id SERIAL PRIMARY KEY,
    name             VARCHAR(50) NOT NULL,
    category         VARCHAR(50),
    is_outdoor       BOOLEAN DEFAULT TRUE,
    icon             VARCHAR(10)
);

-- ── Dimensão de segmento ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS dim_segment (
    segment_id       BIGINT PRIMARY KEY,
    strava_id        BIGINT UNIQUE NOT NULL,
    name             VARCHAR(255),
    distance_m       FLOAT,
    elevation_gain_m FLOAT,
    avg_grade_pct    FLOAT,
    city             VARCHAR(100),
    state            VARCHAR(100),
    country          VARCHAR(100),
    kom_time_sec     INT
);

-- ── Dimensão de dispositivo ──────────────────────────────────
CREATE TABLE IF NOT EXISTS dim_device (
    device_id              SERIAL PRIMARY KEY,
    name                   VARCHAR(100),
    brand                  VARCHAR(100),
    has_gps                BOOLEAN DEFAULT TRUE,
    has_heartrate_monitor  BOOLEAN DEFAULT FALSE
);

-- ── Fato: atividades ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fact_activities (
    activity_id       BIGINT PRIMARY KEY,
    athlete_id        BIGINT REFERENCES dim_athlete(athlete_id) ON DELETE CASCADE,
    date_id           INT REFERENCES dim_date(date_id),
    activity_type_id  INT REFERENCES dim_activity_type(activity_type_id),
    device_id         INT REFERENCES dim_device(device_id),
    strava_name       VARCHAR(255),
    start_date        TIMESTAMP,
    distance_meters   FLOAT,
    moving_time_sec   INT,
    elapsed_time_sec  INT,
    elevation_gain_m  FLOAT,
    avg_pace_sec_km   FLOAT,
    best_pace_sec_km  FLOAT,
    avg_heartrate     FLOAT,
    max_heartrate     INT,
    calories          FLOAT,
    training_load     FLOAT,
    kudos_count       INT DEFAULT 0,
    hr_zone_1_pct     FLOAT,
    hr_zone_2_pct     FLOAT,
    hr_zone_3_pct     FLOAT,
    hr_zone_4_pct     FLOAT,
    hr_zone_5_pct     FLOAT,
    cluster_label     VARCHAR(20),
    created_at        TIMESTAMP DEFAULT NOW(),
    updated_at        TIMESTAMP DEFAULT NOW()
);

-- ── Fato: esforços em segmentos ──────────────────────────────
CREATE TABLE IF NOT EXISTS fact_segments (
    effort_id         BIGINT PRIMARY KEY,
    segment_id        BIGINT REFERENCES dim_segment(segment_id),
    athlete_id        BIGINT REFERENCES dim_athlete(athlete_id),
    activity_id       BIGINT REFERENCES fact_activities(activity_id),
    date_id           INT REFERENCES dim_date(date_id),
    elapsed_time_sec  INT,
    avg_heartrate     FLOAT,
    avg_pace_sec_km   FLOAT,
    pr_rank           INT,
    kom_rank          INT,
    kom_gap_sec       INT,
    created_at        TIMESTAMP DEFAULT NOW()
);

-- ── Fato: leaderboards ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS fact_leaderboards (
    leaderboard_id   SERIAL PRIMARY KEY,
    segment_id       BIGINT REFERENCES dim_segment(segment_id),
    athlete_id       BIGINT REFERENCES dim_athlete(athlete_id),
    date_id          INT REFERENCES dim_date(date_id),
    rank_position    INT,
    elapsed_time_sec INT,
    entries_count    INT,
    captured_at      TIMESTAMP DEFAULT NOW()
);

-- ── Log de execuções ETL ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS etl_logs (
    log_id         SERIAL PRIMARY KEY,
    athlete_id     BIGINT,
    rows_processed INT DEFAULT 0,
    errors         INT DEFAULT 0,
    duration_sec   FLOAT,
    status         VARCHAR(20),
    run_at         TIMESTAMP DEFAULT NOW()
);

-- ── Índices de performance ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_fact_act_athlete    ON fact_activities(athlete_id);
CREATE INDEX IF NOT EXISTS idx_fact_act_date       ON fact_activities(date_id);
CREATE INDEX IF NOT EXISTS idx_fact_act_start_date ON fact_activities(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_fact_act_pace       ON fact_activities(avg_pace_sec_km);
CREATE INDEX IF NOT EXISTS idx_fact_act_cluster    ON fact_activities(cluster_label);
CREATE INDEX IF NOT EXISTS idx_fact_seg_segment    ON fact_segments(segment_id);
CREATE INDEX IF NOT EXISTS idx_fact_seg_athlete    ON fact_segments(athlete_id);
CREATE INDEX IF NOT EXISTS idx_fact_lbd_segment    ON fact_leaderboards(segment_id);
CREATE INDEX IF NOT EXISTS idx_etl_logs_athlete    ON etl_logs(athlete_id);
