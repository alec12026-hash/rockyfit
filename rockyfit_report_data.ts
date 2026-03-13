import { sql } from '@vercel/postgres';
async function main() {
  const userId = 1;
  const latestSession = await sql`
    SELECT id, user_id, workout_id, week_num, day_num, completed_at, total_volume, duration_minutes, notes, rating
    FROM workout_sessions
    WHERE user_id = ${userId}
    ORDER BY completed_at DESC
    LIMIT 1`;
  const sessionId = latestSession.rows[0]?.id;
  const sets = sessionId ? await sql`
    SELECT exercise_id, set_num, weight_lbs, reps, rpe, is_pr
    FROM workout_sets
    WHERE session_id = ${sessionId}
    ORDER BY exercise_id, set_num` : { rows: [] } as any;
  const healthToday = await sql`
    SELECT * FROM health_daily
    WHERE user_id = ${userId}
    ORDER BY source_date DESC, updated_at DESC
    LIMIT 3`;
  const weeklySessions = await sql`
    SELECT completed_at, total_volume
    FROM workout_sessions
    WHERE user_id = ${userId}
      AND completed_at >= NOW() - INTERVAL '7 days'
    ORDER BY completed_at DESC`;
  const monthlyPRs = await sql`
    SELECT COUNT(*)::int AS pr_count
    FROM personal_records
    WHERE user_id = ${userId}
      AND achieved_at >= NOW() - INTERVAL '30 days'`;
  console.log(JSON.stringify({
    latestSession: latestSession.rows[0] || null,
    sets: sets.rows,
    health: healthToday.rows,
    weeklySessions: weeklySessions.rows,
    monthlyPRs: monthlyPRs.rows[0] || { pr_count: 0 }
  }, null, 2));
}
main().catch(err => { console.error(err); process.exit(1); });
