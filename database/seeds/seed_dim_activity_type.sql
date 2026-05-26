INSERT INTO dim_activity_type (name, category, is_outdoor, icon) VALUES
    ('Run',              'Corrida',   TRUE,  'running'),
    ('TrailRun',         'Corrida',   TRUE,  'mountain'),
    ('Walk',             'Caminhada', TRUE,  'walking'),
    ('Hike',             'Caminhada', TRUE,  'hiking'),
    ('Ride',             'Ciclismo',  TRUE,  'bike'),
    ('VirtualRide',      'Ciclismo',  FALSE, 'bike'),
    ('EBikeRide',        'Ciclismo',  TRUE,  'ebike'),
    ('Swim',             'Natação',   TRUE,  'swim'),
    ('Workout',          'Treino',    FALSE, 'gym'),
    ('WeightTraining',   'Treino',    FALSE, 'weights'),
    ('Yoga',             'Bem-estar', FALSE, 'yoga'),
    ('RockClimbing',     'Escalada',  TRUE,  'climb'),
    ('Kayaking',         'Água',      TRUE,  'kayak'),
    ('Rowing',           'Água',      TRUE,  'row'),
    ('Crossfit',         'Treino',    FALSE, 'crossfit')
ON CONFLICT DO NOTHING;
