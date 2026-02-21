const { sql } = require('@vercel/postgres');

async function main() {
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

  console.log('Database setup complete.');
}

main().catch(console.error);
