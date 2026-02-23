import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

// GET /api/migrate?secret=<HEALTH_INGEST_TOKEN>
// Creates tables if they don't exist, then adds any missing columns. Safe to run multiple times.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get('secret');
  const token = process.env.HEALTH_INGEST_TOKEN;

  if (!token || secret !== token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const migrations = [
    // Create tables
    `CREATE TABLE IF NOT EXISTS workout_logs (
      id SERIAL PRIMARY KEY,
      exercise_id TEXT NOT NULL,
      weight NUMERIC(6,2),
      sets INTEGER,
      reps INTEGER,
      rpe NUMERIC(3,1),
      date TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS health_daily (
      id SERIAL PRIMARY KEY,
      source_date DATE NOT NULL UNIQUE,
      weight_kg NUMERIC(7,4),
      weight_lbs NUMERIC(8,4),
      sleep_hours NUMERIC(8,4),
      sleep_quality INTEGER,
      resting_hr INTEGER,
      hrv NUMERIC(5,1),
      steps INTEGER,
      energy_level INTEGER,
      soreness_level INTEGER,
      stress_level INTEGER,
      mood INTEGER,
      water_oz INTEGER,
      nutrition_rating INTEGER,
      active_kcal_day INTEGER,
      notes TEXT,
      readiness_score INTEGER,
      readiness_zone TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS health_workouts (
      id SERIAL PRIMARY KEY,
      source_date DATE NOT NULL,
      workout_type TEXT,
      duration_min INTEGER,
      avg_hr INTEGER,
      max_hr INTEGER,
      active_kcal INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    // Widen columns that may have been created with too-small precision
    `ALTER TABLE health_daily ALTER COLUMN sleep_hours TYPE NUMERIC(8,4)`,
    `ALTER TABLE health_daily ALTER COLUMN weight_kg TYPE NUMERIC(7,4)`,
    `ALTER TABLE health_daily ALTER COLUMN weight_lbs TYPE NUMERIC(8,4)`,
    // Add any missing columns (safe if table already had some columns)
    `ALTER TABLE health_daily ADD COLUMN IF NOT EXISTS weight_lbs NUMERIC(8,4)`,
    `ALTER TABLE health_daily ADD COLUMN IF NOT EXISTS sleep_quality INTEGER`,
    `ALTER TABLE health_daily ADD COLUMN IF NOT EXISTS energy_level INTEGER`,
    `ALTER TABLE health_daily ADD COLUMN IF NOT EXISTS soreness_level INTEGER`,
    `ALTER TABLE health_daily ADD COLUMN IF NOT EXISTS stress_level INTEGER`,
    `ALTER TABLE health_daily ADD COLUMN IF NOT EXISTS mood INTEGER`,
    `ALTER TABLE health_daily ADD COLUMN IF NOT EXISTS water_oz INTEGER`,
    `ALTER TABLE health_daily ADD COLUMN IF NOT EXISTS nutrition_rating INTEGER`,
    `ALTER TABLE health_daily ADD COLUMN IF NOT EXISTS active_kcal_day INTEGER`,
    `ALTER TABLE health_daily ADD COLUMN IF NOT EXISTS notes TEXT`,
    `ALTER TABLE health_daily ADD COLUMN IF NOT EXISTS readiness_score INTEGER`,
    `ALTER TABLE health_daily ADD COLUMN IF NOT EXISTS readiness_zone TEXT`,
    `ALTER TABLE health_daily ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`,
  ];

  const results: string[] = [];
  for (const m of migrations) {
    const label = m.trim().split('\n')[0].slice(0, 80);
    try {
      await sql.query(m);
      results.push(`✓ ${label}`);
    } catch (err: unknown) {
      results.push(`✗ ${label} — ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({ ok: true, results });
}
