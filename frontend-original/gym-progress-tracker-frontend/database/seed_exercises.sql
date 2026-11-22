-- Gym Progress Tracker / Biblioteca de ejercicios
-- Basado en el modelo descrito en Database Design Specification.
-- Ejecutar una sola vez en la base gym_progress_tracker.
-- Comprueba primero si ya existen ejercicios con el mismo nombre para evitar duplicados.

INSERT INTO exercise (exercise_name, muscle_group, exercise_type, equipment, description)
SELECT v.exercise_name, v.muscle_group, v.exercise_type, v.equipment, v.description
FROM (
    SELECT 'Press de banca' AS exercise_name, 'Pecho' AS muscle_group, 'Compuesto' AS exercise_type, 'Barra' AS equipment,
           'Ejercicio principal para desarrollar fuerza y masa muscular del pectoral.' AS description
    UNION ALL SELECT 'Press inclinado con mancuernas', 'Pecho', 'Compuesto', 'Mancuernas', 'Variación inclinada que enfatiza la porción clavicular del pectoral.'
    UNION ALL SELECT 'Aperturas en polea', 'Pecho', 'Aislamiento', 'Polea', 'Movimiento de aislamiento para trabajar la aducción horizontal del hombro.'
    UNION ALL SELECT 'Jalón al pecho', 'Espalda', 'Compuesto', 'Polea', 'Tracción vertical orientada al dorsal ancho y la musculatura de la espalda.'
    UNION ALL SELECT 'Remo con barra', 'Espalda', 'Compuesto', 'Barra', 'Ejercicio de tracción horizontal para espalda media, dorsales y estabilizadores.'
    UNION ALL SELECT 'Peso muerto', 'Piernas', 'Compuesto', 'Barra', 'Movimiento multiarticular de bisagra de cadera que involucra cadena posterior y piernas.'
    UNION ALL SELECT 'Sentadilla', 'Piernas', 'Compuesto', 'Barra', 'Patrón básico de flexión de rodilla y cadera para cuádriceps y glúteos.'
    UNION ALL SELECT 'Prensa de piernas', 'Piernas', 'Compuesto', 'Máquina', 'Ejercicio guiado para trabajar principalmente cuádriceps y glúteos.'
    UNION ALL SELECT 'Press militar', 'Hombros', 'Compuesto', 'Mancuernas', 'Empuje vertical para desarrollar deltoides y estabilidad del tren superior.'
    UNION ALL SELECT 'Elevaciones laterales', 'Hombros', 'Aislamiento', 'Mancuernas', 'Aislamiento del deltoides medio para el trabajo de anchura del hombro.'
    UNION ALL SELECT 'Curl de bíceps', 'Brazos', 'Aislamiento', 'Mancuernas', 'Flexión de codo enfocada en el bíceps braquial.'
    UNION ALL SELECT 'Extensión de tríceps en polea', 'Brazos', 'Aislamiento', 'Polea', 'Movimiento de extensión de codo para trabajar el tríceps.'
    UNION ALL SELECT 'Plancha abdominal', 'Core', 'Isométrico', 'Peso corporal', 'Trabajo isométrico de estabilidad anterior del tronco.'
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM exercise e WHERE LOWER(e.exercise_name) = LOWER(v.exercise_name)
);
