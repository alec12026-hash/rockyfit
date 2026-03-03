'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';

interface TapSelectorProps {
  label: string;
  value: number | null;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
}

function TapSelector({ label, value, onChange, min = 1, max = 5 }: TapSelectorProps) {
  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-secondary mb-2 uppercase tracking-wide">{label}</label>
      <div className="flex gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`flex-1 py-3 rounded-md text-sm font-bold transition-all ${
              value === opt
                ? 'bg-accent text-black'
                : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CheckInPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sleepHours, setSleepHours] = useState<number | null>(null);
  const [energyLevel, setEnergyLevel] = useState<number | null>(null);
  const [sorenessLevel, setSorenessLevel] = useState<number | null>(null);
  const [mood, setMood] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sleepHours === null) return;
    
    setSubmitting(true);
    
    try {
      const res = await fetch('/api/health/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sleepHours,
          energyLevel,
          sorenessLevel,
          mood,
          notes: notes || undefined,
        }),
      });
      
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/'), 1500);
      }
    } catch (error) {
      console.error('Check-in failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-display font-bold uppercase">Check-in saved!</h2>
          <p className="text-sm text-secondary mt-2">Redirecting to home...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface p-6 pb-24">
      <header className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-secondary hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Back</span>
        </button>
        <h1 className="font-display font-bold text-2xl tracking-tighter uppercase">Daily Check-in</h1>
        <p className="text-sm text-secondary mt-1">How are you feeling today?</p>
      </header>

      <form onSubmit={handleSubmit}>
        <div className="bg-surface border border-zinc-200 rounded-md p-4 mb-6 shadow-subtle">
          <label className="block text-sm font-medium text-secondary mb-2 uppercase tracking-wide">
            Sleep Hours
          </label>
          <input
            type="number"
            min="0"
            max="12"
            step="0.5"
            value={sleepHours ?? ''}
            onChange={(e) => setSleepHours(e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="e.g. 7.5"
            className="w-full px-4 py-3 rounded-md border border-zinc-200 bg-white text-lg font-medium focus:outline-none focus:border-accent"
            required
          />
          <p className="text-xs text-zinc-400 mt-1">Hours slept last night</p>
        </div>

        <TapSelector
          label="Energy Level"
          value={energyLevel}
          onChange={setEnergyLevel}
        />

        <TapSelector
          label="Soreness Level"
          value={sorenessLevel}
          onChange={setSorenessLevel}
        />

        <TapSelector
          label="Mood"
          value={mood}
          onChange={setMood}
        />

        <div className="mb-6">
          <label className="block text-sm font-medium text-secondary mb-2 uppercase tracking-wide">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes for Rocky..."
            rows={3}
            className="w-full px-4 py-3 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:border-accent resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={sleepHours === null || submitting}
          className="w-full py-4 bg-primary text-white rounded-md font-display font-bold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          {submitting ? 'Saving...' : 'Save Check-in'}
        </button>
      </form>
    </div>
  );
}
