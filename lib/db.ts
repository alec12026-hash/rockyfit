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
  userId?: number;
  weightKg?: number | null;
  weightLbs?: number | null;
  sleepHours?: number | null;
  sleepQuality?: number | null;
  restingHr?: number | null;
  hrv?: number | null;
  steps?: number | null;
  energyLevel?: number | null;
  sorenessLevel?: number | null;
  stressLevel?: number | null;
  mood?: number | null;
  waterOz?: number | null;
  nutritionRating?: number | null;
  activeKcalDay?: number | null;
  leanBm?: number | null;
  bodyFat?: number | null;
  bmi?: number | null;
  notes?: string | null;
  readinessScore?: number | null;
  readinessZone?: string | null;
}) {
  if (!hasDb) return;
  const userId = payload.userId || 1;
  await sql`
    INSERT INTO health_daily (
      source_date, user_id, weight_kg, weight_lbs, sleep_hours, sleep_quality, resting_hr, hrv, steps,
      energy_level, soreness_level, stress_level, mood, water_oz, nutrition_rating, active_kcal_day,
      lean_bm, body_fat, bmi, notes, readiness_score, readiness_zone, updated_at
    )
    VALUES (
      ${payload.sourceDate},
      ${userId},
      ${payload.weightKg ?? null},
      ${payload.weightLbs ?? null},
      ${payload.sleepHours ?? null},
      ${payload.sleepQuality ?? null},
      ${payload.restingHr ?? null},
      ${payload.hrv ?? null},
      ${payload.steps ?? null},
      ${payload.energyLevel ?? null},
      ${payload.sorenessLevel ?? null},
      ${payload.stressLevel ?? null},
      ${payload.mood ?? null},
      ${payload.waterOz ?? null},
      ${payload.nutritionRating ?? null},
      ${payload.activeKcalDay ?? null},
      ${payload.leanBm ?? null},
      ${payload.bodyFat ?? null},
      ${payload.bmi ?? null},
      ${payload.notes ?? null},
      ${payload.readinessScore ?? null},
      ${payload.readinessZone ?? null},
      NOW()
    )
    ON CONFLICT (source_date, user_id)
    DO UPDATE SET
      weight_kg = COALESCE(EXCLUDED.weight_kg, health_daily.weight_kg),
      weight_lbs = COALESCE(EXCLUDED.weight_lbs, health_daily.weight_lbs),
      sleep_hours = COALESCE(EXCLUDED.sleep_hours, health_daily.sleep_hours),
      sleep_quality = COALESCE(EXCLUDED.sleep_quality, health_daily.sleep_quality),
      resting_hr = COALESCE(EXCLUDED.resting_hr, health_daily.resting_hr),
      hrv = COALESCE(EXCLUDED.hrv, health_daily.hrv),
      steps = COALESCE(EXCLUDED.steps, health_daily.steps),
      energy_level = COALESCE(EXCLUDED.energy_level, health_daily.energy_level),
      soreness_level = COALESCE(EXCLUDED.soreness_level, health_daily.soreness_level),
      stress_level = COALESCE(EXCLUDED.stress_level, health_daily.stress_level),
      mood = COALESCE(EXCLUDED.mood, health_daily.mood),
      water_oz = COALESCE(EXCLUDED.water_oz, health_daily.water_oz),
      nutrition_rating = COALESCE(EXCLUDED.nutrition_rating, health_daily.nutrition_rating),
      active_kcal_day = COALESCE(EXCLUDED.active_kcal_day, health_daily.active_kcal_day),
      lean_bm = COALESCE(EXCLUDED.lean_bm, health_daily.lean_bm),
      body_fat = COALESCE(EXCLUDED.body_fat, health_daily.body_fat),
      bmi = COALESCE(EXCLUDED.bmi, health_daily.bmi),
      notes = COALESCE(EXCLUDED.notes, health_daily.notes),
      readiness_score = COALESCE(EXCLUDED.readiness_score, health_daily.readiness_score),
      readiness_zone = COALESCE(EXCLUDED.readiness_zone, health_daily.readiness_zone),
      updated_at = NOW()
  `;
}

export async function getTodayHealthLog(sourceDate: string, userId: number = 1) {
  if (!hasDb) return null;
  const { rows } = await sql`
    SELECT * FROM health_daily WHERE source_date = ${sourceDate} AND user_id = ${userId} LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function getHealthHistory(days = 7, userId: number = 1) {
  if (!hasDb) return [];
  const { rows } = await sql`
    SELECT * FROM health_daily
    WHERE user_id = ${userId}
    ORDER BY source_date DESC
    LIMIT ${days}
  `;
  return rows;
}

export async function getHealthWorkoutHistory(days = 7) {
  if (!hasDb) return [];
  const { rows } = await sql`
    SELECT source_date, workout_type, duration_min, avg_hr, max_hr, active_kcal, created_at
    FROM health_workouts
    ORDER BY source_date DESC, created_at DESC
    LIMIT ${Math.max(days * 4, 20)}
  `;
  return rows;
}

export async function saveHealthWorkout(payload: {
  sourceDate: string;
  userId?: number;
  workoutType?: string | null;
  durationMin?: number | null;
  avgHr?: number | null;
  maxHr?: number | null;
  activeKcal?: number | null;
}) {
  if (!hasDb) return;
  const userId = payload.userId || 1;
  await sql`
    INSERT INTO health_workouts (source_date, user_id, workout_type, duration_min, avg_hr, max_hr, active_kcal, created_at)
    VALUES (
      ${payload.sourceDate},
      ${userId},
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
