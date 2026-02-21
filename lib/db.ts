import { sql } from '@vercel/postgres';

export async function getLogs() {
  const { rows } = await sql`SELECT * FROM workout_logs ORDER BY date DESC LIMIT 50`;
  return rows;
}

export async function saveLog(exerciseId: string, weight: number, sets: number, reps: number, rpe: number) {
  await sql`
    INSERT INTO workout_logs (exercise_id, weight, sets, reps, rpe, date)
    VALUES (${exerciseId}, ${weight}, ${sets}, ${reps}, ${rpe}, NOW())
  `;
}
