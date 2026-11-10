-- Database schema for Sweety Blood Glucose Tracker
-- Run this in your PostgreSQL database (e.g., Supabase SQL Editor) if the users table does not exist yet.

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'patient',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optional index for faster email lookup during login
CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
