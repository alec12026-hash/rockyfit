'use client';

import { useState } from 'react';
import { ArrowLeft, Save, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import NumericKeypad from './NumericKeypad';

type SetSlot = {
  id: number | null;
  set_num: number;
  weight_lbs: string;
  reps: string;
  rpe: string;
  is_pr: boolean;
};

type ExerciseBlock = {
  exercise_id: string;
  display_name: string;
  sets: SetSlot[];
};

type Session = {
  id: number;
  workout_id: string;
  workout_title: string;
  completed_at: string;
  coaching_report_sent: boolean;
  allExercises: ExerciseBlock[];
};

type KeypadState = {
  exerciseIdx: number;
  setIdx: number;
  field: 'weight_lbs' | 'reps' | 'rpe';
  label: string;
  value: string;
} | null;

export default function EditHistoryView({ session }: { session: Session }) {
  const [exercises, setExercises] = useState<ExerciseBlock[]>(session.allExercises);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [keypad, setKeypad] = useState<KeypadState>(null);

  const openKeypad = (exerciseIdx: number, setIdx: number, field: 'weight_lbs' | 'reps' | 'rpe') => {
    const set = exercises[exerciseIdx].sets[setIdx];
    const labels = { weight_lbs: 'Weight (lbs)', reps: 'Reps', rpe: 'RPE' };
    setKeypad({ exerciseIdx, setIdx, field, label: labels[field], value: set[field] });
  };

  const closeKeypad = () => {
    if (!keypad) return;
    const { exerciseIdx, setIdx, field, value } = keypad;
    setExercises(prev => {
      const updated = prev.map((ex, ei) => {
        if (ei !== exerciseIdx) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s, si) =>
            si === setIdx ? { ...s, [field]: value } : s
          ),
        };
      });
      return updated;
    });
    setKeypad(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    // Collect sets that have at least weight or reps filled
    const setsToUpdate = exercises.flatMap(ex =>
      ex.sets
        .filter(s => s.weight_lbs || s.reps) // only send sets with some data
        .map(s => ({
          id: s.id,
          exercise_id: ex.exercise_id,
          set_num: s.set_num,
          weight_lbs: parseFloat(s.weight_lbs) || 0,
          reps: parseFloat(s.reps) || 0,
          rpe: s.rpe ? parseFloat(s.rpe) : null,
        }))
    );

    try {
      const res = await fetch('/api/workout/history', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id, sets: setsToUpdate }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage(
          session.coaching_report_sent
            ? "Saved! Edits will be taken into account in tomorrow's coaching report."
            : "Saved! Your edits will be reflected in tonight's report."
        );
        setTimeout(() => setMessage(null), 6000);
      } else {
        alert('Failed to save changes.');
      }
    } catch (e) {
      console.error(e);
      alert('Error saving changes.');
    } finally {
      setSaving(false);
    }
  };

  const dateFormatted = new Date(session.completed_at).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <div className="pb-36 bg-background min-h-screen">
      {/* Numeric Keypad */}
      {keypad && (
        <NumericKeypad
          value={keypad.value}
          label={keypad.label}
          onChange={v => setKeypad(k => k ? { ...k, value: v } : null)}
          onClose={closeKeypad}
        />
      )}

      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-zinc-200 px-6 py-4 flex items-center gap-4">
        <Link href="/history" className="p-2 -ml-2 text-secondary hover:text-primary">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-bold text-xl uppercase truncate">{session.workout_title}</h1>
          <p className="text-xs text-secondary">{dateFormatted}</p>
        </div>
      </div>

      {/* Exercise Blocks */}
      <div className="p-6 space-y-8">
        {exercises.map((ex, exerciseIdx) => (
          <div key={ex.exercise_id}>
            <h3 className="font-display font-bold text-base uppercase mb-3 pb-1 border-b border-zinc-100 text-primary">
              {ex.display_name}
            </h3>

            {/* Column Headers */}
            <div className="grid grid-cols-10 gap-2 text-xs font-display font-bold text-secondary uppercase mb-2 text-center">
              <div className="col-span-1">#</div>
              <div className="col-span-3">LBS</div>
              <div className="col-span-3">REPS</div>
              <div className="col-span-3">RPE</div>
            </div>

            {/* Set Rows */}
            <div className="space-y-2">
              {ex.sets.map((set, setIdx) => (
                <div
                  key={setIdx}
                  className={`grid grid-cols-10 gap-2 items-center py-1 rounded-sm ${
                    setIdx % 2 === 1 ? 'bg-zinc-50/60' : 'bg-white'
                  }`}
                >
                  <div className="col-span-1 text-center font-mono text-zinc-400 text-sm">
                    {set.set_num}
                    {set.is_pr && <span className="block text-[8px] text-amber-500 font-bold">PR</span>}
                  </div>

                  {(['weight_lbs', 'reps', 'rpe'] as const).map(field => (
                    <div
                      key={field}
                      onClick={() => openKeypad(exerciseIdx, setIdx, field)}
                      className={`col-span-3 border rounded-sm p-2 text-center font-body text-lg cursor-pointer transition-colors select-none ${
                        set[field]
                          ? 'border-zinc-300 bg-white text-primary'
                          : 'border-zinc-200 bg-zinc-50 text-zinc-300'
                      }`}
                    >
                      {set[field] || (field === 'weight_lbs' ? 'LBS' : field === 'rpe' ? 'RPE' : 'REPS')}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-20 bg-surface border-t border-zinc-200 max-w-md mx-auto z-30">
        {message ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md text-sm font-bold text-green-800 flex items-center gap-2">
            <CheckCircle size={18} className="shrink-0" />
            <span>{message}</span>
          </div>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 bg-primary text-white font-display font-bold text-lg uppercase rounded-md shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-transform hover:bg-zinc-800 disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>
    </div>
  );
}
