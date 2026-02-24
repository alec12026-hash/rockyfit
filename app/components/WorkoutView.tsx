'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Copy, Save, Repeat, Timer, Play, Pause, X } from 'lucide-react';
import Link from 'next/link';
import type { WorkoutDay } from '@/lib/program';

// Mock alternates database
const ALTERNATES: Record<string, string[]> = {
  'bench_press': ['Dumbbell Press', 'Smith Machine Press', 'Weighted Pushup'],
  'deadlift': ['Rack Pull', 'Trap Bar Deadlift', 'RDL'],
  'squat': ['Leg Press', 'Hack Squat', 'Smith Squat'],
  'hack_squat': ['Leg Press', 'Goblet Squat', 'Front Squat'],
  'meadows_row': ['One Arm DB Row', 'Cable Row', 'T-Bar Row'],
};

// Rest time recommendations (seconds)
const REST_TIMES: Record<string, number> = {
  'bench_press': 180,      // 3 min
  'deadlift': 240,         // 4 min
  'squat': 240,            // 4 min
  'larson_press': 180,
  'incline_smith': 120,
  'egyptian_raise': 60,
  'skull_crusher': 90,
  'jm_press': 120,
  'dips': 120,
  'meadows_row': 120,
  'pullup_neutral': 120,
  'straight_arm': 60,
  'rear_delt_fly': 60,
  'bayesian_curl': 90,
  'waiter_curl': 60,
  'hack_squat': 180,
  'bulgarian': 120,
  'sldl': 180,
  'seated_ham': 90,
  'donkey_calf': 60,
};

interface WorkoutViewProps {
  workout: WorkoutDay;
  dayId: string;
}

export default function WorkoutView({ workout, dayId }: WorkoutViewProps) {
  const [logs, setLogs] = useState<Record<string, any[]>>({});
  const [history, setHistory] = useState<Record<string, { weight: number, reps: number }>>({});
  const [progressData, setProgressData] = useState<Record<string, any[]>>({});
  const [swaps, setSwaps] = useState<Record<string, string>>({}); 
  const [showSwapMenu, setShowSwapMenu] = useState<string | null>(null);
  
  // Rest Timer State
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerTarget, setTimerTarget] = useState(0);
  const [currentTimerExercise, setCurrentTimerExercise] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Form state for sets
  const [setData, setSetData] = useState<Record<string, { weight: string; reps: string; rpe: string }[]>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // Fallback mock data (until DB is wired)
        setHistory({
          'bench_press': { weight: 225, reps: 8 },
          'deadlift': { weight: 405, reps: 5 },
          'squat': { weight: 315, reps: 6 },
          'meadows_row': { weight: 80, reps: 12 },
          'larson_press': { weight: 185, reps: 10 },
          'incline_smith': { weight: 135, reps: 12 },
          'hack_squat': { weight: 270, reps: 10 },
          'sldl': { weight: 225, reps: 10 },
          'bulgarian': { weight: 60, reps: 10 },
        });
      } catch (e) {
        console.log('Using mock history');
      }
    };

    fetchHistory();
  }, []);

  // Timer logic
  useEffect(() => {
    if (timerActive && timerSeconds < timerTarget) {
      timerRef.current = setTimeout(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    } else if (timerActive && timerSeconds >= timerTarget) {
      setTimerActive(false);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timerActive, timerSeconds, timerTarget]);

  const startRestTimer = (exerciseId: string, seconds: number) => {
    const restTime = REST_TIMES[exerciseId] || 120;
    setTimerTarget(restTime);
    setTimerSeconds(0);
    setCurrentTimerExercise(exerciseId);
    setTimerActive(true);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSwap = (originalId: string, newName: string) => {
    setSwaps(prev => ({ ...prev, [originalId]: newName }));
    setShowSwapMenu(null);
  };

  const handleSetChange = (exerciseId: string, setIdx: number, field: 'weight' | 'reps' | 'rpe', value: string) => {
    setSetData(prev => {
      const exData = prev[exerciseId] || [];
      const newExData = [...exData];
      newExData[setIdx] = { ...newExData[setIdx], [field]: value };
      return { ...prev, [exerciseId]: newExData };
    });
  };

  const getSetData = (exerciseId: string, setIdx: number, field: 'weight' | 'reps' | 'rpe') => {
    return setData[exerciseId]?.[setIdx]?.[field] || '';
  };

  const calculateTarget = (prevWeight: number, prevReps: number) => {
    return { weight: prevWeight + 5, reps: prevReps + 1 };
  };

  const handleFinishWorkout = async () => {
    setSaving(true);
    setSaveError(null);

    const idMatch = dayId.match(/^w(\d+)_d(\d+)_/);
    const weekNum = idMatch ? Number(idMatch[1]) : 1;
    const dayNum = idMatch ? Number(idMatch[2]) : 0;

    const setsToSave = [];
    for (const ex of workout?.exercises || []) {
      const exSets = setData[ex.id] || [];
      for (let i = 0; i < exSets.length; i++) {
        const s = exSets[i];
        if (s.weight && s.reps) {
          setsToSave.push({
            exercise_id: ex.id,
            set_num: i + 1,
            weight_lbs: parseInt(s.weight),
            reps: parseInt(s.reps),
            rpe: s.rpe ? parseInt(s.rpe) : null
          });
        }
      }
    }

    try {
      const res = await fetch('/api/workout/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutId: dayId,
          weekNum,
          dayNum,
          sets: setsToSave,
          readinessBefore: null,
          rating: null
        })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setSaved(true);
      } else {
        setSaveError(result.error || 'Save failed.');
      }
    } catch (e) {
      console.error('Save failed:', e);
      setSaveError('Network error while saving workout.');
    }

    setSaving(false);
  };

  return (
    <div className="pb-32">
      {/* Rest Timer Overlay */}
      {timerActive && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="bg-surface p-8 rounded-lg text-center max-w-sm w-full mx-4">
            <button 
              onClick={() => { setTimerActive(false); setCurrentTimerExercise(null); }}
              className="absolute top-4 right-4 p-2"
            >
              <X className="text-secondary" />
            </button>
            
            <h3 className="font-display font-bold text-xl uppercase text-secondary mb-2">Rest Timer</h3>
            <div className={`font-mono text-6xl font-bold mb-4 ${timerSeconds >= timerTarget ? 'text-green-500' : 'text-primary'}`}>
              {formatTime(timerTarget - timerSeconds)}
            </div>
            
            <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent transition-all duration-1000"
                style={{ width: `${(timerSeconds / timerTarget) * 100}%` }}
              />
            </div>
            
            <p className="text-xs text-secondary mt-4 uppercase">
              {currentTimerExercise ? REST_TIMES[currentTimerExercise] ? `${REST_TIMES[currentTimerExercise]}s recommended` : 'Rest up' : ''}
            </p>
            
            <div className="flex gap-2 mt-6">
              <button 
                onClick={() => setTimerActive(false)}
                className="flex-1 py-3 bg-zinc-100 text-secondary font-bold uppercase rounded-sm"
              >
                Skip
              </button>
              <button 
                onClick={() => { setTimerSeconds(0); setTimerTarget(timerTarget + 30); }}
                className="flex-1 py-3 bg-primary text-white font-bold uppercase rounded-sm"
              >
                +30s
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-zinc-200 px-6 py-4 flex items-center gap-4">
        <Link href={`/week/${dayId.split('_')[0].replace('w','')}`} className="p-2 -ml-2 text-secondary hover:text-primary">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display font-bold text-xl uppercase">{workout.title}</h1>
          <p className="text-xs text-secondary uppercase tracking-wide">{workout.focus}</p>
        </div>
        {saved && (
          <span className="text-xs font-bold text-green-600 uppercase bg-green-50 px-2 py-1 rounded">
            Saved ✓
          </span>
        )}
      </div>

      <div className="p-6 space-y-8">
        {workout.exercises.map((ex, i) => {
          const isSwapped = swaps[ex.id];
          const displayName = isSwapped || ex.name;
          const prev = history[ex.id];
          const target = prev ? calculateTarget(prev.weight, prev.reps) : null;

          return (
            <div key={ex.id} className="scroll-mt-24 relative" id={ex.id}>
              
              {/* Exercise Header */}
              <div className="mb-3">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-lg uppercase">{displayName}</h3>
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

                {/* Swap Menu */}
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

                {/* Progressive Overload Target */}
                {prev && (
                  <div className="flex items-center gap-2 bg-accent/10 border-l-2 border-accent px-2 py-1.5 rounded-r-sm mb-2">
                    <span className="text-[10px] font-bold uppercase text-primary">Beat Last Time:</span>
                    <span className="font-mono text-xs text-primary">{prev.weight}lbs x {prev.reps}</span>
                    <ArrowRight className="text-accent" size={12} />
                    <span className="font-mono text-xs font-bold text-primary">
                      Target: {target?.weight ?? '--'}x{target?.reps ?? '--'}
                    </span>
                  </div>
                )}

                {/* Meta Row */}
                <div className="flex gap-3 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  <span>Rest: {ex.rest}</span>
                  {ex.rpe && <span>RPE: {ex.rpe}</span>}
                  <button 
                    onClick={() => startRestTimer(ex.id, REST_TIMES[ex.id] || 120)}
                    className="flex items-center gap-1 text-accent hover:text-accent/80"
                  >
                    <Timer size={12} /> Start Timer
                  </button>
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
                      placeholder={prev ? `${prev.weight}` : "LBS"} 
                      value={getSetData(ex.id, setIdx, 'weight')}
                      onChange={(e) => handleSetChange(ex.id, setIdx, 'weight', e.target.value)}
                      className="col-span-3 bg-white border border-zinc-200 rounded-sm p-2 text-center font-body text-lg focus:border-primary focus:ring-0 outline-none placeholder:text-zinc-300"
                    />
                    <input 
                      type="number" 
                      placeholder={prev ? `${prev.reps}` : "REPS"} 
                      value={getSetData(ex.id, setIdx, 'reps')}
                      onChange={(e) => handleSetChange(ex.id, setIdx, 'reps', e.target.value)}
                      className="col-span-3 bg-white border border-zinc-200 rounded-sm p-2 text-center font-body text-lg focus:border-primary focus:ring-0 outline-none placeholder:text-zinc-300"
                    />
                     <input 
                      type="number" 
                      placeholder="RPE" 
                      value={getSetData(ex.id, setIdx, 'rpe')}
                      onChange={(e) => handleSetChange(ex.id, setIdx, 'rpe', e.target.value)}
                      className="col-span-3 bg-white border border-zinc-200 rounded-sm p-2 text-center font-body text-lg focus:border-primary focus:ring-0 outline-none placeholder:text-zinc-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-20 bg-surface border-t border-zinc-200 max-w-md mx-auto">
        {saveError && (
          <p className="text-xs text-red-600 font-bold mb-2 text-center">{saveError}</p>
        )}
        <button 
          onClick={handleFinishWorkout}
          disabled={saving || saved}
          className={`w-full py-4 font-display font-bold text-lg uppercase rounded-md shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-transform ${saved ? 'bg-green-600 text-white' : 'bg-primary text-white hover:bg-zinc-800'}`}
        >
          <Save size={20} /> 
          {saving ? 'Saving...' : saved ? 'Workout Saved!' : 'Finish Workout'}
        </button>
      </div>
    </div>
  );
}
