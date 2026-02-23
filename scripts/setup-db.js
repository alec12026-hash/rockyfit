const { sql } = require('@vercel/postgres');

async function main() {
  // Workout logs (individual set tracking)
  await sql`
    CREATE TABLE IF NOT EXISTS workout_logs (
      id SERIAL PRIMARY KEY,
      exercise_id VARCHAR(50) NOT NULL,
      weight INTEGER,
      sets INTEGER,
      reps INTEGER,
      rpe INTEGER,
      date TIMESTAMP DEFAULT NOW()
    );
  `;

  // Daily health data from Apple Health
  await sql`
    CREATE TABLE IF NOT EXISTS health_daily (
      id SERIAL PRIMARY KEY,
      source_date DATE UNIQUE NOT NULL,
      weight_kg NUMERIC(6,2),
      sleep_hours NUMERIC(4,2),
      resting_hr INTEGER,
      hrv INTEGER,
      steps INTEGER,
      readiness_score INTEGER,
      readiness_zone VARCHAR(16),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  // Workout sessions from Apple Health
  await sql`
    CREATE TABLE IF NOT EXISTS health_workouts (
      id SERIAL PRIMARY KEY,
      source_date DATE NOT NULL,
      workout_type VARCHAR(64),
      duration_min NUMERIC(6,2),
      avg_hr INTEGER,
      max_hr INTEGER,
      active_kcal INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  // Full workout sessions (COMPLETED WORKOUTS)
  await sql`
    CREATE TABLE IF NOT EXISTS workout_sessions (
      id SERIAL PRIMARY KEY,
      workout_id VARCHAR(50) NOT NULL,
      week_num INTEGER NOT NULL,
      day_num INTEGER NOT NULL,
      completed_at TIMESTAMP DEFAULT NOW(),
      total_volume INTEGER DEFAULT 0,
      notes TEXT,
      readiness_before INTEGER,
      rating INTEGER
    );
  `;

  // Individual set logs with timestamps
  await sql`
    CREATE TABLE IF NOT EXISTS workout_sets (
      id SERIAL PRIMARY KEY,
      session_id INTEGER REFERENCES workout_sessions(id),
      exercise_id VARCHAR(50) NOT NULL,
      set_num INTEGER NOT NULL,
      weight_lbs INTEGER,
      reps INTEGER,
      rpe INTEGER,
      is_pr BOOLEAN DEFAULT FALSE,
      completed_at TIMESTAMP DEFAULT NOW()
    );
  `;

  // Personal Records tracking
  await sql`
    CREATE TABLE IF NOT EXISTS personal_records (
      id SERIAL PRIMARY KEY,
      exercise_id VARCHAR(50) NOT NULL,
      record_type VARCHAR(20) NOT NULL, -- '1rm', 'volume', 'reps'
      value INTEGER NOT NULL,
      weight_lbs INTEGER,
      reps INTEGER,
      achieved_at TIMESTAMP DEFAULT NOW()
    );
  `;

  // Expand health_daily with manual check-in fields
  await sql`ALTER TABLE health_daily ADD COLUMN IF NOT EXISTS weight_lbs NUMERIC(6,2)`;
  await sql`ALTER TABLE health_daily ADD COLUMN IF NOT EXISTS sleep_quality INTEGER`;
  await sql`ALTER TABLE health_daily ADD COLUMN IF NOT EXISTS energy_level INTEGER`;
  await sql`ALTER TABLE health_daily ADD COLUMN IF NOT EXISTS soreness_level INTEGER`;
  await sql`ALTER TABLE health_daily ADD COLUMN IF NOT EXISTS stress_level INTEGER`;
  await sql`ALTER TABLE health_daily ADD COLUMN IF NOT EXISTS mood INTEGER`;
  await sql`ALTER TABLE health_daily ADD COLUMN IF NOT EXISTS water_oz INTEGER`;
  await sql`ALTER TABLE health_daily ADD COLUMN IF NOT EXISTS nutrition_rating INTEGER`;
  await sql`ALTER TABLE health_daily ADD COLUMN IF NOT EXISTS active_kcal_day INTEGER`;
  await sql`ALTER TABLE health_daily ADD COLUMN IF NOT EXISTS notes TEXT`;

  // Body composition tracking
  await sql`
    CREATE TABLE IF NOT EXISTS body_measurements (
      id SERIAL PRIMARY KEY,
      recorded_at DATE NOT NULL,
      weight_lbs NUMERIC(6,2),
      body_fat_estimate NUMERIC(5,2),
      chest_inches NUMERIC(5,2),
      waist_inches NUMERIC(5,2),
      arms_inches NUMERIC(5,2),
      thighs_inches NUMERIC(5,2),
      photo_url TEXT,
      notes TEXT
    );
  `;

  // User preferences/settings
  await sql`
    CREATE TABLE IF NOT EXISTS user_settings (
      id SERIAL PRIMARY KEY,
      key VARCHAR(50) UNIQUE NOT NULL,
      value TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  console.log('Database setup complete - all tables created/verified.');
}

main().catch(console.error);
