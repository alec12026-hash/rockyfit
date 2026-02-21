'use client';

import { useState } from 'react';
import { getWorkoutById } from '@/lib/program'; // Updated import
import { ArrowLeft, Copy, Save } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default function WorkoutPage({ params }: { params: { day: string } }) {
  // Use the new lookup helper that scans all weeks
  const workout = getWorkoutById(params.day);
  
  // State for logs
  const [logs, setLogs] = useState<Record<string, any[]>>({});

  if (!workout) return notFound(); // Standard 404 if ID is bad

  return (
    <div className="pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-zinc-200 px-6 py-4 flex items-center gap-4">
        {/* Helper: go back to the WEEK view, we need to extract week num from ID (w1_...) */}
        <Link href={`/week/${workout.id.split('_')[0].replace('w','')}`} className="p-2 -ml-2 text-secondary hover:text-primary">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display font-bold text-xl uppercase">{workout.title}</h1>
          <p className="text-xs text-secondary uppercase tracking-wide">{workout.focus}</p>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {workout.exercises.map((ex, i) => (
          <div key={ex.id} className="scroll-mt-24" id={ex.id}>
            <div className="mb-3">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="font-display font-bold text-lg uppercase">{ex.name}</h3>
                <span className="text-xs font-mono bg-zinc-100 px-2 py-1 rounded text-secondary border border-zinc-200">
                  {ex.sets} x {ex.reps}
                </span>
              </div>
              {/* Meta Row */}
              <div className="flex gap-3 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                <span>Rest: {ex.rest}</span>
                {ex.rpe && <span>RPE: {ex.rpe}</span>}
              </div>
              {ex.notes && <p className="text-xs text-secondary mt-1 italic">Note: {ex.notes}</p>}
            </div>
            
            {/* Input Grid */}
            <div className="space-y-2">
              <div className="grid grid-cols-10 gap-2 text-xs font-display font-bold text-secondary uppercase mb-1 text-center">
                <div className="col-span-1">#</div>
                <div className="col-span-3">LBS</div>
                <div className="col-span-3">REPS</div>
                <div className="col-span-3">RPE</div>
              </div>
              
              {Array.from({ length: ex.sets }).map((_, setIdx) => (
                <div key={setIdx} className="grid grid-cols-10 gap-2 items-center">
                  <div className="col-span-1 text-center font-mono text-zinc-400 text-sm">{setIdx + 1}</div>
                  <input 
                    type="number" 
                    placeholder="LBS" 
                    className="col-span-3 bg-white border border-zinc-200 rounded-sm p-2 text-center font-body text-lg focus:border-primary focus:ring-0 outline-none placeholder:text-zinc-300"
                  />
                  <input 
                    type="number" 
                    placeholder="REPS" 
                    className="col-span-3 bg-white border border-zinc-200 rounded-sm p-2 text-center font-body text-lg focus:border-primary focus:ring-0 outline-none placeholder:text-zinc-300"
                  />
                   <input 
                    type="number" 
                    placeholder="RPE" 
                    className="col-span-3 bg-white border border-zinc-200 rounded-sm p-2 text-center font-body text-lg focus:border-primary focus:ring-0 outline-none placeholder:text-zinc-300"
                  />
                </div>
              ))}
              
              <button className="w-full mt-2 py-2 flex items-center justify-center gap-2 text-xs font-bold uppercase text-secondary border border-dashed border-zinc-300 rounded-sm hover:bg-zinc-50 hover:text-primary transition-colors">
                <Copy size={12} /> Copy Previous Set
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface border-t border-zinc-200 max-w-md mx-auto">
        <button className="w-full bg-primary text-white font-display font-bold text-lg uppercase py-4 rounded-md shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
          <Save size={20} /> Finish Workout
        </button>
      </div>
    </div>
  );
}
