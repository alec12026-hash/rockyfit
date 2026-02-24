import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

// POST /api/workout/save - Save completed workout
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workoutId, weekNum, dayNum, sets, notes, readinessBefore, rating } = body;

    if (
      !workoutId ||
      weekNum === undefined || weekNum === null ||
      dayNum === undefined || dayNum === null ||
      !Array.isArray(sets)
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!Number.isFinite(Number(weekNum)) || !Number.isFinite(Number(dayNum))) {
      return NextResponse.json({ error: `Invalid week/day values: week=${weekNum}, day=${dayNum}` }, { status: 400 });
    }

    // Calculate total volume
    const totalVolume = sets.reduce((acc: number, set: any) => {
      return acc + (set.weight_lbs || 0) * (set.reps || 0);
    }, 0);

    // Insert workout session
    const sessionResult = await sql`
      INSERT INTO workout_sessions (workout_id, week_num, day_num, total_volume, notes, readiness_before, rating)
      VALUES (${workoutId}, ${Number(weekNum)}, ${Number(dayNum)}, ${totalVolume}, ${notes || null}, ${readinessBefore || null}, ${rating || null})
      RETURNING id
    `;

    const sessionId = sessionResult.rows[0].id;

    // Insert each set and check for PRs
    const insertedSets = [];
    for (const set of sets) {
      // Check if this is a PR
      let isPR = false;
      if (set.weight_lbs && set.reps) {
        const estimated1RM = Math.round(set.weight_lbs * (1 + set.reps / 30)); // Epley formula
        const prCheck = await sql`
          SELECT value FROM personal_records 
          WHERE exercise_id = ${set.exercise_id} AND record_type = '1rm'
          ORDER BY value DESC LIMIT 1
        `;
        
        if (prCheck.rows.length === 0 || estimated1RM > prCheck.rows[0].value) {
          isPR = true;
          await sql`
            INSERT INTO personal_records (exercise_id, record_type, value, weight_lbs, reps)
            VALUES (${set.exercise_id}, '1rm', ${estimated1RM}, ${set.weight_lbs}, ${set.reps})
          `;
        }
      }

      const setResult = await sql`
        INSERT INTO workout_sets (session_id, exercise_id, set_num, weight_lbs, reps, rpe, is_pr)
        VALUES (${sessionId}, ${set.exercise_id}, ${set.set_num}, ${set.weight_lbs || null}, ${set.reps || null}, ${set.rpe || null}, ${isPR})
        RETURNING *
      `;
      insertedSets.push(setResult.rows[0]);
    }

    // Get all PRs achieved in this workout
    const prs = insertedSets.filter((s: any) => s.is_pr);

    return NextResponse.json({ 
      success: true, 
      sessionId,
      totalVolume,
      prsAchieved: prs.length
    });
  } catch (error) {
    console.error('Error saving workout:', error);
    return NextResponse.json({ error: 'Failed to save workout' }, { status: 500 });
  }
}

// GET /api/workout/history - Get workout history
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const exerciseId = searchParams.get('exerciseId');
    const limit = parseInt(searchParams.get('limit') || '10');

    let query;
    if (exerciseId) {
      // Get history for specific exercise
      query = await sql`
        SELECT ws.id, ws.workout_id, ws.week_num, ws.day_num, ws.completed_at, ws.total_volume,
               ws.rating, ws.notes
        FROM workout_sessions ws
        JOIN workout_sets wse ON wse.session_id = ws.id
        WHERE wse.exercise_id = ${exerciseId}
        GROUP BY ws.id
        ORDER BY ws.completed_at DESC
        LIMIT ${limit}
      `;
    } else {
      // Get recent workouts
      query = await sql`
        SELECT ws.id, ws.workout_id, ws.week_num, ws.day_num, ws.completed_at, ws.total_volume,
               ws.rating, ws.notes
        FROM workout_sessions ws
        ORDER BY ws.completed_at DESC
        LIMIT ${limit}
      `;
    }

    return NextResponse.json({ workouts: query.rows });
  } catch (error) {
    console.error('Error fetching workout history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
