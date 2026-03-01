import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    const { rows } = await sql`
      SELECT ws.*, 
             json_agg(json_build_object(
               'id', wse.id, 
               'exercise_id', wse.exercise_id, 
               'set_num', wse.set_num, 
               'weight_lbs', wse.weight_lbs, 
               'reps', wse.reps, 
               'rpe', wse.rpe, 
               'is_pr', wse.is_pr
             ) ORDER BY wse.exercise_id, wse.set_num) as sets
      FROM workout_sessions ws
      LEFT JOIN workout_sets wse ON wse.session_id = ws.id
      WHERE ws.user_id = ${userId}
      GROUP BY ws.id
      ORDER BY ws.completed_at DESC
      LIMIT 30
    `;
    return NextResponse.json(rows);
  } catch (error) {
    console.error('History fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const userId = getUserIdFromRequest(req);
    const { sessionId, sets } = await req.json();

    if (!sessionId || !Array.isArray(sets)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // Verify session belongs to user
    const sessionCheck = await sql`
      SELECT id FROM workout_sessions WHERE id = ${sessionId} AND user_id = ${userId}
    `;
    if (sessionCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    for (const s of sets) {
      if (s.id) {
        // Update existing set
        await sql`
          UPDATE workout_sets
          SET weight_lbs = ${s.weight_lbs}, reps = ${s.reps}, rpe = ${s.rpe}
          WHERE id = ${s.id} AND session_id = ${sessionId}
        `;
      } else if (s.exercise_id && (s.weight_lbs || s.reps)) {
        // Insert new set that wasn't logged during the workout
        await sql`
          INSERT INTO workout_sets (session_id, exercise_id, set_num, weight_lbs, reps, rpe, is_pr, user_id)
          VALUES (${sessionId}, ${s.exercise_id}, ${s.set_num}, ${s.weight_lbs || null}, ${s.reps || null}, ${s.rpe || null}, false, ${userId})
        `;
      }
    }

    // Recalculate total volume for the session
    const volumeResult = await sql`
      SELECT COALESCE(SUM(weight_lbs * reps), 0) as total
      FROM workout_sets WHERE session_id = ${sessionId}
    `;
    const totalVolume = volumeResult.rows[0]?.total || 0;
    await sql`
      UPDATE workout_sessions SET total_volume = ${totalVolume} WHERE id = ${sessionId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('History update error:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
