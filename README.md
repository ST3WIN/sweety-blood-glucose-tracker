# Sweety — Blood Glucose Tracker

A minimalist, full-stack personal blood glucose tracking web application built with **React**, **Node.js / Express**, and **PostgreSQL (Supabase)**.

---

## 📌 Features

### 1. Authentication & Security
- Secure registration and login flow with password hashing (`bcrypt`).
- Authentication using JSON Web Tokens (JWT) stored in secure, `HttpOnly` cookies.
- Protected routes on both frontend (`RequireAuth` component) and backend (`authMiddleware.js`).
- Persistent sessions via `/api/auth/me` with automatic redirect handling.

### 2. Blood Glucose Tracking (CRUD)
- Track glucose readings for 4 distinct daily time slots:
  - **Morning (fasting)**
  - **After breakfast**
  - **After lunch**
  - **After dinner**
- Add, view, edit, and delete readings with intuitive modals and confirmation dialogs.
- Interactive day-by-day navigation with quick "Today" shortcut and date picker.

### 3. Strict Validation Rules
All specified business rules are validated on both client and server with explicit feedback:
| Rule | Error Message |
| :--- | :--- |
| Value is required | `"Please enter a glucose value."` |
| Value must be a whole number between 40 and 600 | `"Value must be between 40 and 600 mg/dl."` |
| Only one reading per slot per day | `"You already have an {Slot Name} reading for this date."` |
| Maximum 4 readings per day | `"You can add only 4 readings per day."` |
| Date cannot be in the future | `"Date cannot be in the future."` |

### 4. Reports & Analysis
Generates metrics for any selected date across 3 standard clinical intervals:
- **Daily Report**: The selected date (e.g., `15 Oct 2026`). Also lists each individual reading with its respective time slot.
- **Month-to-Date Report**: 1st of the month to the selected date (e.g., `1 Oct – 15 Oct 2026`).
- **Monthly Report**: The whole previous month (e.g., `1 Sep – 30 Sep 2026` when selecting an October date).
- **Summary Metrics**: Highest reading, lowest reading, average reading (rounded to 1 decimal place), and total count of readings.
- **Friendly Empty State**: Displayed whenever a date range has no logged entries.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React icons, React Router DOM v7
- **Backend**: Node.js, Express 5, `pg` (node-postgres), `jsonwebtoken`, `bcrypt`, `cookie-parser`, `cors`
- **Database**: PostgreSQL (Supabase)
- **Testing**: Node.js native test runner (`node --test`)

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+ recommended)
- **npm** (v9+ recommended)
- A **PostgreSQL** instance (e.g. [Supabase](https://supabase.com))

---

### 2. Installation
Clone the repository and install dependencies for both the backend and frontend:

```bash
# Clone the repository
git clone <YOUR_GITHUB_REPO_URL>
cd sweety-blood-glucose-tracker

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend/sweety
npm install

# Return to root directory
cd ../..
```

---

### 3. Environment Configuration
Create a `.env` file in the `backend/` directory by copying `.env.example`:

```bash
cp backend/.env.example backend/.env
```

Configure the environment variables in `backend/.env`:
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

---

### 4. Database Setup & Seeding

#### A. Run the Database Schema
Execute the SQL in `backend/schema.sql` inside your PostgreSQL database (e.g. Supabase SQL Editor):

```sql
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

-- 2. Reading Slot Enum
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

-- 4. Index
CREATE INDEX IF NOT EXISTS idx_readings_user_date ON readings (user_id, reading_date);
```

#### B. Seed Sample Data
Run the automated seed script to populate a test user with sample readings:

```bash
npm run seed
# Or: cd backend && npm run seed
```

**Seed Script Output & Demo Account:**
- **Email**: `demo@sweety.com`
- **Password**: `Password123!`
- **Sample Readings Included**:
  - Today: Morning fasting (95 mg/dl), After breakfast (138 mg/dl), After lunch (122 mg/dl).
  - Month-to-date: Historical readings across the current month.
  - Previous Month: Complete sample readings throughout the prior month for immediate monthly report testing.

---

### 5. Running the Application

From the root directory, start both the backend server and frontend client:

#### Start Backend (Terminal 1)
```bash
npm run dev:backend
# Server runs on http://localhost:5000
```

#### Start Frontend (Terminal 2)
```bash
npm run dev:frontend
# Client runs on http://localhost:5173
```

Open your browser at **`http://localhost:5173`** to access the application.

---

### 6. Running Automated Tests

Run the built-in validation test suite from the root directory:

```bash
npm test
```

This verifies:
- "Value is required" validation
- "Value between 40 and 600 mg/dl" validation
- "Date cannot be in the future" validation
- "Maximum 4 readings per day" validation
- "Only one reading per slot per day" duplicate check
- Report statistics calculations (highest, lowest, average rounded to 1 decimal place, and count)
- Friendly empty state handling

---

## 📝 Notes

### Assumptions Made
1. **Timezone Handling**: To prevent date-shifting issues between client browsers and the database, `reading_date` is formatted and retrieved as ISO `YYYY-MM-DD` (`TO_CHAR(reading_date, 'YYYY-MM-DD')`).
2. **Slots per Day**: The application treats a day as composed of 4 mutually exclusive slots (`morning_fasting`, `after_breakfast`, `after_lunch`, `after_dinner`). The `UNIQUE (user_id, reading_date, slot)` database constraint naturally enforces both the 1-per-slot and 4-per-day limits.
3. **Monthly Report Definition**: The "Monthly" report strictly covers "The whole previous month" relative to the selected anchor date (e.g. if the user selects 15 October 2026, the report evaluates 1 September 2026 to 30 September 2026).
4. **Roles**: The user schema includes a `role` check constraint (`patient` vs `doctor`), defaulting to `patient`.

### What I Would Improve With More Time
1. **Interactive Glucose Trend Charts**: Add visual line and area charts (using Recharts) to plot 24-hour glucose curves and multi-week glycemic variability.
2. **Custom Target Ranges**: Allow patients or clinicians to customize target blood glucose thresholds (e.g., fasting 70–130 mg/dl, post-meal < 180 mg/dl) with color-coded badges (Low, In Range, High).
3. **Doctor / Clinician Portal**: Enable doctors to view assigned patient logs, add clinical annotations, and view glycemic trends.
4. **Data Exporting**: Export reports directly to PDF or CSV for sharing during doctor visits.
5. **Slot Reminder Push Notifications**: Optional reminders when an expected slot (such as 2 hours after lunch) has not yet been logged.
