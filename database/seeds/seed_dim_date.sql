-- Popula dim_date para 5 anos (2022-01-01 até 2026-12-31)
-- Execute este script UMA VEZ após criar o schema.

INSERT INTO dim_date (date_id, full_date, year, quarter, month, week_of_year, day_of_week, is_weekend, season)
SELECT
    TO_CHAR(d, 'YYYYMMDD')::INT                                      AS date_id,
    d                                                                  AS full_date,
    EXTRACT(YEAR FROM d)::SMALLINT                                    AS year,
    EXTRACT(QUARTER FROM d)::SMALLINT                                 AS quarter,
    EXTRACT(MONTH FROM d)::SMALLINT                                   AS month,
    EXTRACT(WEEK FROM d)::SMALLINT                                    AS week_of_year,
    EXTRACT(DOW FROM d)::SMALLINT                                     AS day_of_week,
    EXTRACT(DOW FROM d) IN (0, 6)                                     AS is_weekend,
    CASE
        WHEN EXTRACT(MONTH FROM d) IN (12, 1, 2)  THEN 'Verão'
        WHEN EXTRACT(MONTH FROM d) IN (3, 4, 5)   THEN 'Outono'
        WHEN EXTRACT(MONTH FROM d) IN (6, 7, 8)   THEN 'Inverno'
        ELSE 'Primavera'
    END                                                               AS season
FROM generate_series('2022-01-01'::DATE, '2026-12-31'::DATE, '1 day'::INTERVAL) AS d
ON CONFLICT (date_id) DO NOTHING;
