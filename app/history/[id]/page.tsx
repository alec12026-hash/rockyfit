import { sql } from '@vercel/postgres';
import { notFound } from 'next/navigation';
import EditHistoryView from '../../components/EditHistoryView';
import { getWorkoutById } from '@/lib/program';

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

    const row = rows[0];
    const savedSets = (row.sets || []).filter((s: any) => s && s.id);

    // Look up the full program workout to get ALL exercises + expected set counts
    const workoutTemplate = getWorkoutById(row.workout_id);

    // Build the full exercise list with slots for every set,
    // pre-filled where data exists, empty otherwise.
    let allExercises: {
      exercise_id: string;
      display_name: string;
      sets: {
        id: number | null;
        set_num: number;
        weight_lbs: string;
        reps: string;
        rpe: string;
        is_pr: boolean;
      }[];
    }[] = [];

    if (workoutTemplate) {
      allExercises = workoutTemplate.exercises.map(ex => {
        const existingSets = savedSets.filter((s: any) => s.exercise_id === ex.id);
        const setCount = Math.max(ex.sets, existingSets.length);

        const sets = Array.from({ length: setCount }, (_, i) => {
          const existing = existingSets.find((s: any) => s.set_num === i + 1);
          return {
            id: existing?.id ?? null,
            set_num: i + 1,
            weight_lbs: existing?.weight_lbs?.toString() || '',
            reps: existing?.reps?.toString() || '',
            rpe: existing?.rpe?.toString() || '',
            is_pr: existing?.is_pr ?? false,
          };
        });

        return { exercise_id: ex.id, display_name: ex.name, sets };
      });
    } else {
      // Fallback: only show exercises that have saved sets
      const grouped: Record<string, typeof allExercises[0]> = {};
      for (const s of savedSets) {
        if (!grouped[s.exercise_id]) {
          grouped[s.exercise_id] = {
            exercise_id: s.exercise_id,
            display_name: s.exercise_id.replace(/_/g, ' '),
            sets: [],
          };
        }
        grouped[s.exercise_id].sets.push({
          id: s.id,
          set_num: s.set_num,
          weight_lbs: s.weight_lbs?.toString() || '',
          reps: s.reps?.toString() || '',
          rpe: s.rpe?.toString() || '',
          is_pr: s.is_pr ?? false,
        });
      }
      allExercises = Object.values(grouped);
    }

    const session = {
      id: row.id as number,
      workout_id: row.workout_id as string,
      workout_title: workoutTemplate?.title || row.workout_id,
      completed_at: new Date(row.completed_at).toISOString(),
      coaching_report_sent: row.coaching_report_sent as boolean ?? false,
      allExercises,
    };

    return <EditHistoryView session={session} />;
  } catch (error) {
    console.error(error);
    notFound();
  }
}
