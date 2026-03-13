import { sql } from '@vercel/postgres';

async function main() {
  const users = await sql`SELECT id, email, name FROM users ORDER BY id LIMIT 5`;
  const sessions = await sql`SELECT id, user_id, workout_id, completed_at, total_volume, duration_minutes, notes, rating FROM workout_sessions WHERE completed_at::date = CURRENT_DATE ORDER BY completed_at DESC LIMIT 20`;
  const healthWorkouts = await sql`SELECT source_date, user_id, workout_type, duration_min, active_kcal, created_at FROM health_workouts WHERE source_date = CURRENT_DATE ORDER BY created_at DESC LIMIT 20`;
  const readiness = await sql`SELECT source_date, user_id, readiness_score, readiness_zone, updated_at FROM health_daily WHERE source_date = CURRENT_DATE ORDER BY updated_at DESC LIMIT 20`;
  console.log('USERS', users.rows);
  console.log('WORKOUT_SESSIONS_TODAY', sessions.rows);
  console.log('HEALTH_WORKOUTS_TODAY', healthWorkouts.rows);
  console.log('HEALTH_DAILY_TODAY', readiness.rows);
}

main().catch(err => { console.error(err); process.exit(1); });
