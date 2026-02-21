import { sql } from '@vercel/postgres';

const hasDb = !!process.env.POSTGRES_URL;

export async function getLogs() {
  if (!hasDb) return [];
  const { rows } = await sql`SELECT * FROM workout_logs ORDER BY date DESC LIMIT 50`;
  return rows;
}

export async function saveLog(exerciseId: string, weight: number, sets: number, reps: number, rpe: number) {
  if (!hasDb) return;
  await sql`
    INSERT INTO workout_logs (exercise_id, weight, sets, reps, rpe, date)
    VALUES (${exerciseId}, ${weight}, ${sets}, ${reps}, ${rpe}, NOW())
  `;
}

export async function getLastLog(exerciseId: string) {
  if (!hasDb) return null;
  const { rows } = await sql`
    SELECT exercise_id, weight, reps, date
    FROM workout_logs
    WHERE exercise_id = ${exerciseId}
    ORDER BY date DESC
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function saveHealthDaily(payload: {
  sourceDate: string;
  weightKg?: number | null;
  sleepHours?: number | null;
  restingHr?: number | null;
  hrv?: number | null;
  steps?: number | null;
  readinessScore?: number | null;
  readinessZone?: string | null;
}) {
  if (!hasDb) return;
  await sql`
    INSERT INTO health_daily (source_date, weight_kg, sleep_hours, resting_hr, hrv, steps, readiness_score, readiness_zone, updated_at)
    VALUES (
      ${payload.sourceDate},
      ${payload.weightKg ?? null},
      ${payload.sleepHours ?? null},
      ${payload.restingHr ?? null},
      ${payload.hrv ?? null},
      ${payload.steps ?? null},
      ${payload.readinessScore ?? null},
      ${payload.readinessZone ?? null},
      NOW()
    )
    ON CONFLICT (source_date)
    DO UPDATE SET
      weight_kg = EXCLUDED.weight_kg,
      sleep_hours = EXCLUDED.sleep_hours,
      resting_hr = EXCLUDED.resting_hr,
      hrv = EXCLUDED.hrv,
      steps = EXCLUDED.steps,
      readiness_score = EXCLUDED.readiness_score,
      readiness_zone = EXCLUDED.readiness_zone,
      updated_at = NOW()
  `;
}

export async function saveHealthWorkout(payload: {
  sourceDate: string;
  workoutType?: string | null;
  durationMin?: number | null;
  avgHr?: number | null;
  maxHr?: number | null;
  activeKcal?: number | null;
}) {
  if (!hasDb) return;
  await sql`
    INSERT INTO health_workouts (source_date, workout_type, duration_min, avg_hr, max_hr, active_kcal, created_at)
    VALUES (
      ${payload.sourceDate},
      ${payload.workoutType ?? null},
      ${payload.durationMin ?? null},
      ${payload.avgHr ?? null},
      ${payload.maxHr ?? null},
      ${payload.activeKcal ?? null},
      NOW()
    )
  `;
}

export async function getLatestReadiness() {
  if (!hasDb) return null;
  const { rows } = await sql`
    SELECT source_date, readiness_score, readiness_zone, sleep_hours, resting_hr, hrv, steps, weight_kg
    FROM health_daily
    ORDER BY source_date DESC
    LIMIT 1
  `;
  return rows[0] ?? null;
}
