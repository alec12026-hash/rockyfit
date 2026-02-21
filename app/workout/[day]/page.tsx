'use client';

import { useState, useEffect } from 'react';
import { getWorkoutById } from '@/lib/program'; 
import { ArrowLeft, Copy, Save, Repeat } from 'lucide-react'; // Added Repeat icon
import Link from 'next/link';
import { notFound } from 'next/navigation';

// Mock alternates database (would be in DB/program.ts)
const ALTERNATES: Record<string, string[]> = {
  'bench_press': ['Dumbbell Press', 'Smith Machine Press', 'Weighted Pushup'],
  'deadlift': ['Rack Pull', 'Trap Bar Deadlift', 'RDL'],
  'squat': ['Leg Press', 'Hack Squat', 'Smith Squat'],
  'hack_squat': ['Leg Press', 'Goblet Squat', 'Front Squat'],
  'meadows_row': ['One Arm DB Row', 'Cable Row', 'T-Bar Row'],
};

export default function WorkoutPage({ params }: { params: { day: string } }) {
  const workout = getWorkoutById(params.day);
  const [logs, setLogs] = useState<Record<string, any[]>>({});
  const [history, setHistory] = useState<Record<string, { weight: number, reps: number }>>({});
  
  // Feature 3: Swap State
  const [swaps, setSwaps] = useState<Record<string, string>>({}); 
  const [showSwapMenu, setShowSwapMenu] = useState<string | null>(null);

  // Feature 1: Load History (Mocking "Last Week" for now)
  useEffect(() => {
    // In real app: fetch('/api/history')...
    setHistory({
      'bench_press': { weight: 225, reps: 8 },
      'deadlift': { weight: 405, reps: 5 },
      'squat': { weight: 315, reps: 6 },
      'meadows_row': { weight: 80, reps: 12 },
    });
  }, []);

  if (!workout) return notFound();

  const handleSwap = (originalId: string, newName: string) => {
    setSwaps(prev => ({ ...prev, [originalId]: newName }));
    setShowSwapMenu(null);
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-zinc-200 px-6 py-4 flex items-center gap-4">
        <Link href={`/week/${workout.id.split('_')[0].replace('w','')}`} className="p-2 -ml-2 text-secondary hover:text-primary">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display font-bold text-xl uppercase">{workout.title}</h1>
          <p className="text-xs text-secondary uppercase tracking-wide">{workout.focus}</p>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {workout.exercises.map((ex, i) => {
          const isSwapped = swaps[ex.id];
          const displayName = isSwapped || ex.name;
          const prev = history[ex.id];

          return (
            <div key={ex.id} className="scroll-mt-24 relative" id={ex.id}>
              
              {/* Exercise Header */}
              <div className="mb-3">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-lg uppercase">{displayName}</h3>
                      {/* Feature 3: Swap Button */}
                      {ALTERNATES[ex.id] && !isSwapped && (
                        <button 
                          onClick={() => setShowSwapMenu(showSwapMenu === ex.id ? null : ex.id)}
                          className="p-1 text-zinc-300 hover:text-accent transition-colors"
                        >
                          <Repeat size={14} />
                        </button>
                      )}
                    </div>
                    {isSwapped && <span className="text-[10px] text-accent uppercase font-bold tracking-wider">Swapped from {ex.name}</span>}
                  </div>
                  
                  <span className="text-xs font-mono bg-zinc-100 px-2 py-1 rounded text-secondary border border-zinc-200 whitespace-nowrap ml-2">
                    {ex.sets} x {ex.reps}
                  </span>
                </div>

                {/* Feature 3: Swap Menu */}
                {showSwapMenu === ex.id && (
                  <div className="mb-3 bg-white border border-zinc-200 rounded-md shadow-lg p-2 z-20">
                    <p className="text-[10px] font-bold text-secondary uppercase mb-2">Select Alternative:</p>
                    <div className="flex flex-wrap gap-2">
                      {ALTERNATES[ex.id].map(alt => (
                        <button 
                          key={alt}
                          onClick={() => handleSwap(ex.id, alt)}
                          className="text-xs bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-sm hover:border-accent hover:bg-accent/10 transition-colors"
                        >
                          {alt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feature 1: Progressive Overload Target */}
                {prev && (
                  <div className="flex items-center gap-2 bg-accent/10 border-l-2 border-accent px-2 py-1.5 rounded-r-sm mb-2">
                    <span className="text-[10px] font-bold uppercase text-primary">Beat Last Time:</span>
                    <span className="font-mono text-xs text-primary">{prev.weight}lbs x {prev.reps}</span>
                    <ArrowRight className="text-accent" size={12} />
                    <span className="font-mono text-xs font-bold text-primary">
                      {/* Simple logic: +5lbs or +1 rep */}
                      Target: {prev.weight}x{prev.reps + 1} or {prev.weight + 5}x{prev.reps}
                    </span>
                  </div>
                )}

                {/* Meta Row */}
                <div className="flex gap-3 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  <span>Rest: {ex.rest}</span>
                  {ex.rpe && <span>RPE: {ex.rpe}</span>}
                </div>
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
                      // Feature 1: Pre-fill placeholder with last weight
                      placeholder={prev ? `${prev.weight}` : "LBS"} 
                      className="col-span-3 bg-white border border-zinc-200 rounded-sm p-2 text-center font-body text-lg focus:border-primary focus:ring-0 outline-none placeholder:text-zinc-300"
                    />
                    <input 
                      type="number" 
                      placeholder={prev ? `${prev.reps}` : "REPS"} 
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
          );
        })}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface border-t border-zinc-200 max-w-md mx-auto">
        <button className="w-full bg-primary text-white font-display font-bold text-lg uppercase py-4 rounded-md shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
          <Save size={20} /> Finish Workout
        </button>
      </div>
    </div>
  );
}
