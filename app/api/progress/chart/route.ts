import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

// GET /api/progress/chart - Get progress data for charts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const exerciseId = searchParams.get('exerciseId');
    const type = searchParams.get('type') || '1rm'; // rm, volume, bodyweight

    if (!exerciseId) {
      // Return all exercises 1RM trends
      const query = await sql`
        SELECT 
          exercise_id,
          MAX(value) as max_1rm,
          COUNT(*) as total_workouts,
          MAX(achieved_at) as last_pr
        FROM personal_records 
        WHERE record_type = '1rm'
        GROUP BY exercise_id
        ORDER BY max_1rm DESC
      `;
      return NextResponse.json({ trends: query.rows });
    }

    // Get specific exercise progress over time
    let dataQuery;
    if (type === '1rm') {
      dataQuery = await sql`
        SELECT 
          DATE(completed_at) as date,
          MAX(weight_lbs * (1 + reps::numeric / 30)) as estimated_1rm,
          MAX(weight_lbs) as max_weight,
          SUM(weight_lbs * reps) as volume
        FROM workout_sets
        WHERE exercise_id = ${exerciseId}
        GROUP BY DATE(completed_at)
        ORDER BY date DESC
        LIMIT 20
      `;
    } else {
      dataQuery = await sql`
        SELECT 
          DATE(completed_at) as date,
          SUM(weight_lbs * reps) as total_volume,
          COUNT(*) as total_sets,
          AVG(rpe) as avg_rpe
        FROM workout_sets
        WHERE exercise_id = ${exerciseId}
        GROUP BY DATE(completed_at)
        ORDER BY date DESC
        LIMIT 20
      `;
    }

    return NextResponse.json({ 
      exerciseId, 
      type, 
      data: dataQuery.rows.reverse() 
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}
