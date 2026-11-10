-- Supabase PostgreSQL Schema for Sweety Blood Glucose Tracker

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'doctor')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Reading Slot Enum (The 4 time slots)
DO $$ BEGIN
    CREATE TYPE reading_slot AS ENUM (
        'morning_fasting',
        'after_breakfast',
        'after_lunch',
        'after_dinner'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Readings Table
CREATE TABLE IF NOT EXISTS readings (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reading_date DATE NOT NULL,
    slot reading_slot NOT NULL,
    value INT NOT NULL CHECK (value BETWEEN 40 AND 600),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, reading_date, slot)
);

-- 4. Index for fast querying by user and date
CREATE INDEX IF NOT EXISTS idx_readings_user_date ON readings (user_id, reading_date);
