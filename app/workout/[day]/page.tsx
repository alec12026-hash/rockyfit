import { getWorkoutById, WEEKS } from '@/lib/program';
import Link from 'next/link';
import WorkoutView from '@/app/components/WorkoutView';

export default async function WorkoutPage({ params }: { params: Promise<{ day: string }> }) {
  // 1. Await params (Next.js 15+ requirement)
  const resolvedParams = await params;
  const rawDay = decodeURIComponent(resolvedParams.day);

  // 2. Resolve Workout ID (New or Legacy)
  let workout = getWorkoutById(rawDay);
  
  if (!workout && rawDay) {
    // Legacy suffix match
    for (const week of WEEKS) {
      const found = week.days.find((d) => d.id.endsWith(`_${rawDay}`));
      if (found) {
        workout = found;
        break;
      }
    }
  }

  // 3. Handle Not Found
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

  // 4. Render Client View
  return <WorkoutView workout={workout} dayId={rawDay} />;
}
