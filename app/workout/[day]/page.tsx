'use client';

import { useState } from 'react';
import { PROGRAM } from '@/lib/program';
import { ArrowLeft, Copy, Save } from 'lucide-react';
import Link from 'next/link';

export default function WorkoutPage({ params }: { params: { day: string } }) {
  const workout = PROGRAM[params.day];
  
  // Simple state for demo - in real app, sync this to DB
  const [logs, setLogs] = useState<Record<string, any[]>>({});

  if (!workout) return <div>Workout not found</div>;

  return (
    <div className="pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-zinc-200 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="p-2 -ml-2 text-secondary hover:text-primary">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-display font-bold text-xl uppercase">{workout.title}</h1>
      </div>

      <div className="p-6 space-y-8">
        {workout.exercises.map((ex, i) => (
          <div key={ex.id} className="scroll-mt-24" id={ex.id}>
            <div className="mb-3 flex justify-between items-baseline">
              <h3 className="font-display font-bold text-lg uppercase">{ex.name}</h3>
              <span className="text-xs font-mono bg-zinc-100 px-2 py-1 rounded text-secondary">
                {ex.sets} x {ex.reps}
              </span>
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
        <button className="w-full bg-primary text-white font-display font-bold text-lg uppercase py-4 rounded-md shadow-lg flex items-center justify-center gap-2">
          <Save size={20} /> Finish Workout
        </button>
      </div>
    </div>
  );
}
