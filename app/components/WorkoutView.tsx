'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Save, Repeat, Timer, X, Copy, CheckCircle, Brain } from 'lucide-react';
import Link from 'next/link';
import type { WorkoutDay } from '@/lib/program';
import NumericKeypad from './NumericKeypad';

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

type KeypadState = {
  isOpen: boolean;
  exerciseId: string;
  setIdx: number;
  field: 'weight' | 'reps' | 'rpe';
  label: string;
  value: string;
} | null;

export default function WorkoutView({ workout, dayId }: WorkoutViewProps) {
  const [history, setHistory] = useState<Record<string, { weight: number, reps: number }>>({});
  const [swaps, setSwaps] = useState<Record<string, string>>({}); 
  const [showSwapMenu, setShowSwapMenu] = useState<string | null>(null);
  
  // Settings
  const [settings, setSettings] = useState({ rest_timer_minutes: 2, coaching_report_time: '21:00' });

  // Rest Timer State
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerTarget, setTimerTarget] = useState(0);
  const [currentTimerExercise, setCurrentTimerExercise] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Form state for sets
  const [setData, setSetData] = useState<Record<string, { weight: string; reps: string; rpe: string }[]>>({});
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'analyzing'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  // Keypad State
  const [keypadState, setKeypadState] = useState<KeypadState>(null);

  // Load history & settings on mount
  useEffect(() => {
    // Load settings
    const storedSettings = localStorage.getItem('rockyfit_settings');
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        setSettings({
          rest_timer_minutes: parseInt(parsed.rest_timer_minutes || '2'),
          coaching_report_time: parsed.coaching_report_time || '21:00'
        });
      } catch (e) { console.error('Error parsing settings', e); }
    }

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
    // Determine duration: use settings if default logic, or use prop if specific
    // The prompt says "Timer duration from settings (default 2 min)"
    // But usually different exercises have different needs. Let's use the setting as the default
    // if we are auto-starting, but respect the exercise specific time if manually started?
    // Prompt says: "Auto-start rest timer... Timer duration from settings".
    // I'll use the setting for auto-start.
    
    setTimerTarget(seconds);
    setTimerSeconds(0);
    setCurrentTimerExercise(exerciseId);
    setTimerActive(true);

    // Service Worker Message
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'START_TIMER',
        endTime: Date.now() + (seconds * 1000),
        exerciseName: exerciseId.replace(/_/g, ' ')
      });
    }
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
      if (!newExData[setIdx]) newExData[setIdx] = { weight: '', reps: '', rpe: '' };
      newExData[setIdx] = { ...newExData[setIdx], [field]: value };
      return { ...prev, [exerciseId]: newExData };
    });
  };

  const getSetData = (exerciseId: string, setIdx: number, field: 'weight' | 'reps' | 'rpe') => {
    return setData[exerciseId]?.[setIdx]?.[field] || '';
  };

  const openKeypad = (exerciseId: string, setIdx: number, field: 'weight' | 'reps' | 'rpe') => {
    const currentVal = getSetData(exerciseId, setIdx, field);
    let label = field === 'weight' ? 'Weight (lbs)' : field === 'reps' ? 'Reps' : 'RPE';
    if (field === 'weight' && settings.rest_timer_minutes) { 
        // Could check units here but prompt says "Weight (lbs)" in keypad label
    }

    setKeypadState({
      isOpen: true,
      exerciseId,
      setIdx,
      field,
      label,
      value: currentVal
    });
  };

  const closeKeypad = () => {
    if (!keypadState) return;
    
    const { exerciseId, setIdx, field, value } = keypadState;
    // Save the final value
    handleSetChange(exerciseId, setIdx, field, value);

    // Auto-start timer logic
    // Check if we just filled the last missing piece (weight or reps)
    const currentSet = setData[exerciseId]?.[setIdx] || { weight: '', reps: '', rpe: '' };
    const weight = field === 'weight' ? value : currentSet.weight;
    const reps = field === 'reps' ? value : currentSet.reps;

    if (weight && reps && !timerActive) {
      // Auto-start timer
      const duration = settings.rest_timer_minutes * 60;
      startRestTimer(exerciseId, duration);
    }

    setKeypadState(null);
  };

  const copyPreviousSet = (exerciseId: string, setIdx: number) => {
    if (setIdx === 0) return;
    const prevSet = setData[exerciseId]?.[setIdx - 1];
    if (prevSet) {
      handleSetChange(exerciseId, setIdx, 'weight', prevSet.weight);
      handleSetChange(exerciseId, setIdx, 'reps', prevSet.reps);
      // RPE is usually different, don't copy
    }
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
        if (s?.weight && s?.reps) {
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
        setSaveState('saved');
        setTimeout(() => {
          setSaveState('analyzing');
        }, 2000);
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
    <div className="pb-32 bg-background min-h-screen">
      {/* Rest Timer Overlay */}
      {timerActive && (
        <div className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-surface p-8 rounded-lg text-center max-w-sm w-full mx-4 shadow-2xl border border-zinc-800 relative">
            <button 
              onClick={() => { setTimerActive(false); setCurrentTimerExercise(null); }}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white"
            >
              <X />
            </button>
            
            <h3 className="font-display font-bold text-xl uppercase text-zinc-400 mb-2">Rest Timer</h3>
            <div className={`font-mono text-7xl font-bold mb-6 tracking-tighter ${timerSeconds >= timerTarget ? 'text-green-500' : 'text-white'}`}>
              {formatTime(timerTarget - timerSeconds)}
            </div>
            
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden mb-6">
              <div 
                className="h-full bg-accent transition-all duration-1000 ease-linear"
                style={{ width: `${Math.min(100, (timerSeconds / timerTarget) * 100)}%` }}
              />
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setTimerActive(false)}
                className="flex-1 py-3 bg-zinc-800 text-zinc-300 font-bold uppercase rounded-sm hover:bg-zinc-700 transition-colors"
              >
                Skip
              </button>
              <button 
                onClick={() => { setTimerSeconds(0); setTimerTarget(timerTarget + 30); }}
                className="flex-1 py-3 bg-primary text-white font-bold uppercase rounded-sm hover:bg-zinc-700 transition-colors"
              >
                +30s
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keypad */}
      {keypadState && (
        <NumericKeypad
          value={keypadState.value}
          label={keypadState.label}
          onChange={(v) => setKeypadState({ ...keypadState, value: v })}
          onClose={closeKeypad}
        />
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
        {saveState === 'saved' && (
          <span className="text-xs font-bold text-green-600 uppercase bg-green-50 px-2 py-1 rounded animate-pulse">
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
                    {isSwapped && <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Swapped from {ex.name}</span>}
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
                    <ArrowRight className="text-zinc-500" size={12} />
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
                    className="flex items-center gap-1 text-zinc-500 hover:text-zinc-800"
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
                
                {Array.from({ length: ex.sets }).map((_, setIdx) => {
                   const setWeight = getSetData(ex.id, setIdx, 'weight');
                   const setReps = getSetData(ex.id, setIdx, 'reps');
                   const setRpe = getSetData(ex.id, setIdx, 'rpe');
                   const isFilled = setWeight && setReps;

                   return (
                    <div key={setIdx} className={`grid grid-cols-10 gap-2 items-center py-1 rounded-sm ${setIdx % 2 === 1 ? 'bg-zinc-50/50' : 'bg-white'}`}>
                      <div className="col-span-1 relative flex items-center justify-center">
                        <span className="font-mono text-zinc-400 text-sm">{setIdx + 1}</span>
                        {/* Copy Button */}
                        {setIdx > 0 && (
                          <button 
                            onClick={() => copyPreviousSet(ex.id, setIdx)}
                            className="absolute -right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-300 hover:text-primary transition-colors"
                          >
                            <Copy size={12} />
                          </button>
                        )}
                      </div>
                      
                      <div 
                        onClick={() => openKeypad(ex.id, setIdx, 'weight')}
                        className={`col-span-3 border rounded-sm p-2 text-center font-body text-lg cursor-pointer transition-colors ${setWeight ? 'bg-white border-zinc-300 text-primary' : 'bg-zinc-50 border-zinc-200 text-zinc-300'}`}
                      >
                        {setWeight || (prev ? prev.weight : 'LBS')}
                      </div>

                      <div 
                        onClick={() => openKeypad(ex.id, setIdx, 'reps')}
                        className={`col-span-3 border rounded-sm p-2 text-center font-body text-lg cursor-pointer transition-colors ${setReps ? 'bg-white border-zinc-300 text-primary' : 'bg-zinc-50 border-zinc-200 text-zinc-300'}`}
                      >
                        {setReps || (prev ? prev.reps : 'REPS')}
                      </div>

                      <div 
                        onClick={() => openKeypad(ex.id, setIdx, 'rpe')}
                        className={`col-span-3 border rounded-sm p-2 text-center font-body text-lg cursor-pointer transition-colors ${setRpe ? 'bg-white border-zinc-300 text-primary' : 'bg-zinc-50 border-zinc-200 text-zinc-300'}`}
                      >
                         {setRpe || 'RPE'}
                      </div>
                    </div>
                   );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-20 bg-surface border-t border-zinc-200 max-w-md mx-auto z-30">
        {saveError && (
          <p className="text-xs text-red-600 font-bold mb-2 text-center">{saveError}</p>
        )}
        
        {saveState === 'idle' && (
          <button 
            onClick={handleFinishWorkout}
            disabled={saving}
            className="w-full py-4 bg-primary text-white font-display font-bold text-lg uppercase rounded-md shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-transform hover:bg-zinc-800"
          >
            <Save size={20} /> 
            {saving ? 'Saving...' : 'Finish Workout'}
          </button>
        )}

        {saveState === 'saved' && (
          <div className="w-full py-4 bg-green-600 text-white font-display font-bold text-lg uppercase rounded-md shadow-lg flex items-center justify-center gap-2 animate-in fade-in zoom-in duration-300">
            <CheckCircle size={20} /> Workout Saved!
          </div>
        )}

        {saveState === 'analyzing' && (
          <div className="w-full bg-zinc-900 text-white rounded-md shadow-lg p-4 animate-in slide-in-from-bottom duration-500">
            <div className="flex items-center gap-2 mb-2">
              <Brain size={18} className="text-accent animate-pulse" />
              <h3 className="font-display font-bold text-sm uppercase">Analysis in Progress</h3>
            </div>
            <p className="text-xs text-zinc-300">
              Rocky is analyzing your session... 🧠 <br/>
              Coaching report coming at <span className="text-white font-bold">{settings.coaching_report_time}</span>. Check Telegram!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
