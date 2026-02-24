import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
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
    const { sessionId, sets } = await req.json();
    
    if (!sessionId || !Array.isArray(sets)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    for (const s of sets) {
      if (s.id) {
        await sql`
          UPDATE workout_sets 
          SET weight_lbs = ${s.weight_lbs}, reps = ${s.reps}, rpe = ${s.rpe}
          WHERE id = ${s.id} AND session_id = ${sessionId}
        `;
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('History update error:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
