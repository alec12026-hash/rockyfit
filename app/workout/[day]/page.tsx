import { sql } from '@vercel/postgres';
import { getWorkoutById, WEEKS } from '@/lib/program';
import { getUserIdFromRequest } from '@/lib/auth';
import Link from 'next/link';
import WorkoutView from '@/app/components/WorkoutView';
import { headers } from 'next/headers';

// Helper to convert generated program data to workout format
function findWorkoutInProgram(programData: any, workoutId: string) {
  const days = programData.days || [];
  if (!days.length) return null;

  // Handle synthetic week/day IDs like w1_d0, w3_d2 from generated schedules
  const idxMatch = workoutId.match(/^w\d+_d(\d+)$/i);
  if (idxMatch) {
    const dayIndex = parseInt(idxMatch[1], 10);
    const day = days[dayIndex % days.length];
    if (day) {
      return {
        id: workoutId,
        title: day.name,
        focus: (day.muscleGroups || []).join(', '),
        exercises: (day.exercises || []).map((ex: any, idx: number) => ({
          id: `${workoutId}_${idx}`,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          rest: ex.rest,
          notes: ex.rationale
        }))
      };
    }
  }

  for (const day of days) {
    const dayId = (day.name || '').toLowerCase().replace(/ /g, '_');
    if (dayId === workoutId || (day.name || '').toLowerCase().includes(workoutId)) {
      return {
        id: workoutId,
        title: day.name,
        focus: (day.muscleGroups || []).join(', '),
        exercises: (day.exercises || []).map((ex: any, idx: number) => ({
          id: `${workoutId}_${idx}`,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          rest: ex.rest,
          notes: ex.rationale
        }))
      };
    }
  }
  return null;
}

export default async function WorkoutPage({ params }: { params: Promise<{ day: string }> }) {
  // 1. Await params (Next.js 15+ requirement)
  const resolvedParams = await params;
  const rawDay = decodeURIComponent(resolvedParams.day);

  // Get user ID from headers/cookies
  const headersList = await headers();
  const request = new Request('http://localhost', {
    headers: Object.fromEntries(headersList.entries())
  });
  const userId = getUserIdFromRequest(request);

  // 2. Resolve workout based on user type
  let workout = null;

  // Non-Alec users: prioritize generated program first
  if (userId !== 1) {
    try {
      const { rows } = await sql`
        SELECT program_data
        FROM user_programs
        WHERE user_id = ${userId} AND is_active = TRUE
        ORDER BY created_at DESC
        LIMIT 1
      `;

      if (rows.length > 0) {
        workout = findWorkoutInProgram(rows[0].program_data, rawDay);
      }
    } catch (e) {
      console.error('Error fetching user program:', e);
    }
  }

  // Alec fallback (and legacy fallback only if still unresolved)
  if (!workout) {
    workout = getWorkoutById(rawDay);
  }

  if (!workout && rawDay) {
    for (const week of WEEKS) {
      const found = week.days.find((d) => d.id.endsWith(`_${rawDay}`));
      if (found) {
        workout = found;
        break;
      }
    }
  }

  // 4. Handle Not Found
  if (!workout) {
    return (
      <div className="p-6 pb-24 min-h-screen bg-background">
        <div className="bg-surface border border-zinc-200 rounded-md p-4">
          <h1 className="font-display font-bold text-lg uppercase mb-2">Workout not found</h1>
          <p className="text-sm text-secondary mb-4">This workout link is invalid or from an old schedule.</p>
          <Link href="/workout" className="text-sm font-bold text-primary hover:underline">Back to Workouts</Link>
        </div>
      </div>
    );
  }

  // 5. Render Client View
  return <WorkoutView workout={workout} dayId={rawDay} />;
}
