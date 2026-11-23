-- Gym Progress Tracker
-- Cloudflare D1 / SQLite
-- Adapted from the user's Database Design Specification.
-- Original table and column names are preserved.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS app_user (
    user_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exercise (
    exercise_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    exercise_name VARCHAR(100) NOT NULL,
    description   TEXT,
    muscle_group  VARCHAR(100) NOT NULL,
    exercise_type VARCHAR(50) NOT NULL DEFAULT 'Compuesto',
    equipment     VARCHAR(100),
    user_id       INTEGER,
    FOREIGN KEY (user_id) REFERENCES app_user(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workout_routine (
    routine_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL,
    routine_name VARCHAR(100) NOT NULL,
    description  TEXT,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES app_user(user_id)
);

CREATE TABLE IF NOT EXISTS routine_exercise (
    routine_exercise_id INTEGER PRIMARY KEY AUTOINCREMENT,
    routine_id          INTEGER NOT NULL,
    exercise_id         INTEGER NOT NULL,
    sets_planned        INTEGER NOT NULL,
    reps_planned        INTEGER NOT NULL,
    exercise_order      INTEGER NOT NULL,
    FOREIGN KEY (routine_id) REFERENCES workout_routine(routine_id),
    FOREIGN KEY (exercise_id) REFERENCES exercise(exercise_id)
);

CREATE TABLE IF NOT EXISTS workout_session (
    session_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL,
    routine_id   INTEGER,
    session_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes        TEXT,
    volume_kg    REAL NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES app_user(user_id),
    FOREIGN KEY (routine_id) REFERENCES workout_routine(routine_id)
);

CREATE TABLE IF NOT EXISTS workout_set (
    set_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id   INTEGER NOT NULL,
    exercise_id  INTEGER NOT NULL,
    set_number   INTEGER NOT NULL,
    repetitions  INTEGER NOT NULL,
    weight_kg    DECIMAL(6,2) NOT NULL DEFAULT 0,
    FOREIGN KEY (session_id) REFERENCES workout_session(session_id),
    FOREIGN KEY (exercise_id) REFERENCES exercise(exercise_id)
);

CREATE TABLE IF NOT EXISTS progress_record (
    progress_id  INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL,
    record_date  DATE NOT NULL,
    metric_name  VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    unit         VARCHAR(30) NOT NULL,
    notes        TEXT,
    FOREIGN KEY (user_id) REFERENCES app_user(user_id)
);

-- Indexes following the naming convention in the specification.
CREATE INDEX IF NOT EXISTS idx_exercise_user_id
    ON exercise(user_id);

CREATE INDEX IF NOT EXISTS idx_workout_session_user_id
    ON workout_session(user_id);

CREATE INDEX IF NOT EXISTS idx_workout_session_session_date
    ON workout_session(session_date);

CREATE INDEX IF NOT EXISTS idx_workout_set_session_id
    ON workout_set(session_id);

CREATE INDEX IF NOT EXISTS idx_progress_record_user_id
    ON progress_record(user_id);

