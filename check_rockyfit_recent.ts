import { sql } from '@vercel/postgres';

async function main() {
  const sessions = await sql`SELECT id, user_id, workout_id, completed_at, total_volume, duration_minutes FROM workout_sessions ORDER BY completed_at DESC LIMIT 10`;
  const healthWorkouts = await sql`SELECT source_date, user_id, workout_type, duration_min, active_kcal, created_at FROM health_workouts ORDER BY created_at DESC LIMIT 10`;
  const readiness = await sql`SELECT source_date, user_id, readiness_score, readiness_zone, updated_at FROM health_daily ORDER BY updated_at DESC LIMIT 10`;
  console.log('RECENT_WORKOUT_SESSIONS', sessions.rows);
  console.log('RECENT_HEALTH_WORKOUTS', healthWorkouts.rows);
  console.log('RECENT_HEALTH_DAILY', readiness.rows);
}
main().catch(err => { console.error(err); process.exit(1); });
