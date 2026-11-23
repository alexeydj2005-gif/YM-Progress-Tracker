-- Gym Progress Tracker / Biblioteca de ejercicios
-- Inserción idempotente: no duplica ejercicios por nombre.

WITH catalog(exercise_name, muscle_group, exercise_type, equipment, description) AS (
    VALUES
    ('Press de banca', 'Pecho', 'Compuesto', 'Barra',
     'Ejercicio principal para desarrollar fuerza y masa muscular del pectoral.'),
    ('Press inclinado con mancuernas', 'Pecho', 'Compuesto', 'Mancuernas',
     'Variación inclinada que enfatiza la porción clavicular del pectoral.'),
    ('Aperturas en polea', 'Pecho', 'Aislamiento', 'Polea',
     'Movimiento de aislamiento para trabajar la aducción horizontal del hombro.'),
    ('Jalón al pecho', 'Espalda', 'Compuesto', 'Polea',
     'Tracción vertical orientada al dorsal ancho y la musculatura de la espalda.'),
    ('Remo con barra', 'Espalda', 'Compuesto', 'Barra',
     'Ejercicio de tracción horizontal para espalda media, dorsales y estabilizadores.'),
    ('Peso muerto', 'Piernas', 'Compuesto', 'Barra',
     'Movimiento multiarticular de bisagra de cadera que involucra cadena posterior y piernas.'),
    ('Sentadilla', 'Piernas', 'Compuesto', 'Barra',
     'Patrón básico de flexión de rodilla y cadera para cuádriceps y glúteos.'),
    ('Prensa de piernas', 'Piernas', 'Compuesto', 'Máquina',
     'Ejercicio guiado para trabajar principalmente cuádriceps y glúteos.'),
    ('Press militar', 'Hombros', 'Compuesto', 'Mancuernas',
     'Empuje vertical para desarrollar deltoides y estabilidad del tren superior.'),
    ('Elevaciones laterales', 'Hombros', 'Aislamiento', 'Mancuernas',
     'Aislamiento del deltoides medio para el trabajo de anchura del hombro.'),
    ('Curl de bíceps', 'Brazos', 'Aislamiento', 'Mancuernas',
     'Flexión de codo enfocada en el bíceps braquial.'),
    ('Extensión de tríceps en polea', 'Brazos', 'Aislamiento', 'Polea',
     'Movimiento de extensión de codo para trabajar el tríceps.'),
    ('Plancha abdominal', 'Core', 'Isométrico', 'Peso corporal',
     'Trabajo isométrico de estabilidad anterior del tronco.')
)
INSERT INTO exercise (
    exercise_name,
    muscle_group,
    exercise_type,
    equipment,
    description
)
SELECT
    c.exercise_name,
    c.muscle_group,
    c.exercise_type,
    c.equipment,
    c.description
FROM catalog c
WHERE NOT EXISTS (
    SELECT 1
    FROM exercise e
    WHERE LOWER(e.exercise_name) = LOWER(c.exercise_name)
);
