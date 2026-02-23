import Link from 'next/link';
import { WEEKS } from '@/lib/program';
import { ArrowLeft, ArrowRight, Dumbbell } from 'lucide-react';

export default function WorkoutIndexPage() {
  const currentWeek = WEEKS[0];

  return (
    <div className="p-6 pb-24 min-h-screen bg-background">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/" className="p-2 -ml-2 text-secondary hover:text-primary">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-display font-bold text-2xl uppercase">Workouts</h1>
      </div>

      <section className="mb-6 bg-surface border border-zinc-200 rounded-md p-4 shadow-subtle">
        <div className="flex items-center gap-2 mb-2">
          <Dumbbell size={18} className="text-accent" />
          <h2 className="font-display font-bold uppercase">Jump back in</h2>
        </div>
        <p className="text-sm text-secondary mb-3">Start from your current program week.</p>
        <Link href={`/week/${currentWeek.number}`} className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
          Open Week {currentWeek.number} <ArrowRight size={14} />
        </Link>
      </section>

      <section className="space-y-3">
        {WEEKS.map((week) => (
          <Link key={week.id} href={`/week/${week.number}`} className="block bg-white border border-zinc-200 rounded-md p-4 hover:border-primary transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-bold text-accent">Week {week.number}</p>
                <p className="font-display font-bold uppercase text-primary">Hypertrophy Phase 2</p>
              </div>
              <ArrowRight size={18} className="text-zinc-300" />
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
