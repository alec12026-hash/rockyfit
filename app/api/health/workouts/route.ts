import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

// GET /api/health/workouts - Get post-workout entries
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30');

    const rows = await sql`
      SELECT id, source_date, workout_type, duration_min, avg_hr, max_hr, active_kcal, created_at
      FROM health_workouts
      ORDER BY source_date DESC
      LIMIT ${limit}
    `;

    return NextResponse.json({ rows: rows.rows });
  } catch (error) {
    console.error('Error fetching workouts:', error);
    return NextResponse.json({ error: 'Failed to fetch workouts' }, { status: 500 });
  }
}
