import { sql } from '@vercel/postgres';
import { notFound } from 'next/navigation';
import EditHistoryView from '../../components/EditHistoryView';

export default async function HistoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
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
      WHERE ws.id = ${id}
      GROUP BY ws.id
    `;

    if (rows.length === 0) notFound();
    
    // Serialize for client component
    const sets = (rows[0].sets || []).filter((s: any) => s && s.id);
    const session = {
        id: rows[0].id as number,
        workout_id: rows[0].workout_id as string,
        completed_at: new Date(rows[0].completed_at).toISOString(),
        coaching_report_sent: rows[0].coaching_report_sent as boolean ?? false,
        sets,
    };

    return <EditHistoryView session={session} />;
  } catch (error) {
    console.error(error);
    notFound();
  }
}
