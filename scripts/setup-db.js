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
  console.log('Database seeded!');
}

main().catch(console.error);
