'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Save, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NumericKeypad from './NumericKeypad';

type Set = {
  id: number;
  exercise_id: string;
  set_num: number;
  weight_lbs: number;
  reps: number;
  rpe: number | null;
  is_pr: boolean;
};

type EditableSet = {
  id: number;
  exercise_id: string;
  set_num: number;
  weight_lbs: string; // Changed to string for editing
  reps: string;      // Changed to string for editing
  rpe: string;       // Changed to string for editing
  is_pr: boolean;
};

type Session = {
  id: number;
  workout_id: string;
  completed_at: string;
  coaching_report_sent: boolean;
  sets: Set[];
};

type KeypadState = {
  isOpen: boolean;
  exerciseId: string;
  setIdx: number;
  field: 'weight' | 'reps' | 'rpe';
  label: string;
  value: string;
} | null;

export default function EditHistoryView({ session }: { session: Session }) {
  const router = useRouter();
  
  // Group sets by exercise and convert to editable strings
  const initialSets: Record<string, EditableSet[]> = {};
  session.sets.forEach(s => {
    if (!initialSets[s.exercise_id]) initialSets[s.exercise_id] = [];
    initialSets[s.exercise_id].push({
      ...s,
      weight_lbs: s.weight_lbs?.toString() || '',
      reps: s.reps?.toString() || '',
      rpe: s.rpe?.toString() || ''
    });
  });

  const [editedSets, setEditedSets] = useState<Record<string, EditableSet[]>>(initialSets);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [keypadState, setKeypadState] = useState<KeypadState>(null);

  const handleSetChange = (exerciseId: string, setIdx: number, field: 'weight' | 'reps' | 'rpe', value: string) => {
    setEditedSets(prev => {
      const exSets = [...(prev[exerciseId] || [])];
      const newSet = { ...exSets[setIdx] };
      
      if (field === 'weight') newSet.weight_lbs = value;
      if (field === 'reps') newSet.reps = value;
      if (field === 'rpe') newSet.rpe = value;
      
      exSets[setIdx] = newSet;
      return { ...prev, [exerciseId]: exSets };
    });
  };

  const openKeypad = (exerciseId: string, setIdx: number, field: 'weight' | 'reps' | 'rpe') => {
    const currentSet = editedSets[exerciseId][setIdx];
    let val = '';
    if (field === 'weight') val = currentSet.weight_lbs;
    if (field === 'reps') val = currentSet.reps;
    if (field === 'rpe') val = currentSet.rpe;

    setKeypadState({
      isOpen: true,
      exerciseId,
      setIdx,
      field,
      label: field === 'weight' ? 'Weight (lbs)' : field === 'reps' ? 'Reps' : 'RPE',
      value: val
    });
  };

  const closeKeypad = () => {
    if (!keypadState) return;
    const { exerciseId, setIdx, field, value } = keypadState;
    handleSetChange(exerciseId, setIdx, field, value);
    setKeypadState(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    // Flatten sets and parse numbers
    const setsToUpdate = Object.values(editedSets).flat().map(s => ({
      id: s.id,
      weight_lbs: parseFloat(s.weight_lbs) || 0,
      reps: parseFloat(s.reps) || 0,
      rpe: s.rpe ? parseFloat(s.rpe) : null
    }));

    try {
      const res = await fetch('/api/workout/history', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id, sets: setsToUpdate })
      });

      const data = await res.json();
      if (data.success) {
        if (session.coaching_report_sent) {
          setMessage("Saved! Edits will be taken into account in tomorrow's coaching report.");
        } else {
          setMessage("Saved! Your edits will be reflected in tonight's report.");
        }
        setTimeout(() => setMessage(null), 5000);
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

  return (
    <div className="pb-32 bg-background min-h-screen">
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
        <Link href="/history" className="p-2 -ml-2 text-secondary hover:text-primary">
          <ArrowLeft size={20} />
        </Link>
        <div>
           <h1 className="font-display font-bold text-xl uppercase">Edit Workout</h1>
           <p className="text-xs text-secondary">{new Date(session.completed_at).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {Object.entries(editedSets).map(([exId, sets]) => (
          <div key={exId}>
            <h3 className="font-display font-bold text-lg uppercase mb-2 border-b border-zinc-100 pb-1">
              {exId.replace(/_/g, ' ')}
            </h3>
            
            <div className="space-y-2">
              <div className="grid grid-cols-10 gap-2 text-xs font-display font-bold text-secondary uppercase mb-1 text-center">
                  <div className="col-span-1">#</div>
                  <div className="col-span-3">LBS</div>
                  <div className="col-span-3">REPS</div>
                  <div className="col-span-3">RPE</div>
              </div>

              {sets.map((set, idx) => (
                <div key={set.id} className={`grid grid-cols-10 gap-2 items-center py-1 rounded-sm ${idx % 2 === 1 ? 'bg-zinc-50/50' : 'bg-white'}`}>
                   <div className="col-span-1 text-center font-mono text-zinc-400 text-sm">{set.set_num}</div>
                   
                   <div 
                      onClick={() => openKeypad(exId, idx, 'weight')}
                      className="col-span-3 border border-zinc-200 rounded-sm p-2 text-center font-body text-lg cursor-pointer bg-white text-primary"
                   >
                      {set.weight_lbs || '-'}
                   </div>

                   <div 
                      onClick={() => openKeypad(exId, idx, 'reps')}
                      className="col-span-3 border border-zinc-200 rounded-sm p-2 text-center font-body text-lg cursor-pointer bg-white text-primary"
                   >
                      {set.reps || '-'}
                   </div>

                   <div 
                      onClick={() => openKeypad(exId, idx, 'rpe')}
                      className="col-span-3 border border-zinc-200 rounded-sm p-2 text-center font-body text-lg cursor-pointer bg-white text-primary"
                   >
                      {set.rpe || '-'}
                   </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 pb-10 bg-surface border-t border-zinc-200 max-w-md mx-auto z-30">
        {message ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md text-sm font-bold text-green-800 flex items-center gap-2 animate-in fade-in duration-300">
            <CheckCircle size={20} className="shrink-0" />
            <span>{message}</span>
          </div>
        ) : (
          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 bg-primary text-white font-display font-bold text-lg uppercase rounded-md shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-transform hover:bg-zinc-800"
          >
            <Save size={20} /> 
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>
    </div>
  );
}
