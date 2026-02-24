'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Moon, Sun, Activity, CheckCircle, TrendingUp, Droplets, Utensils, Zap, AlertTriangle, Brain } from 'lucide-react';
import Link from 'next/link';

// ----- Types -----
interface HealthRow {
  source_date: string;
  weight_lbs: number | null;
  sleep_hours: number | null;
  sleep_quality: number | null;
  resting_hr: number | null;
  hrv: number | null;
  energy_level: number | null;
  soreness_level: number | null;
  stress_level: number | null;
  mood: number | null;
  steps: number | null;
  active_kcal_day: number | null;
  water_oz: number | null;
  nutrition_rating: number | null;
  notes: string | null;
  readiness_score: number | null;
  readiness_zone: string | null;
}

// ----- Helpers -----
function ratingLabel(val: number, type: 'energy' | 'soreness' | 'stress' | 'mood' | 'sleep' | 'nutrition') {
  const maps: Record<string, string[]> = {
    energy:    ['', 'Drained', 'Low', 'Decent', 'Good', 'Fired up'],
    soreness:  ['', 'None', 'Mild', 'Moderate', 'Heavy', 'Painful'],
    stress:    ['', 'Zen', 'Calm', 'Some', 'High', 'Overwhelmed'],
    mood:      ['', 'Bad', 'Meh', 'Okay', 'Good', 'Great'],
    sleep:     ['', 'Terrible', 'Poor', 'Fair', 'Good', 'Perfect'],
    nutrition: ['', 'Off-plan', 'Mostly off', 'Mixed', 'Good', 'Dialed in'],
  };
  return maps[type][val] || '';
}

function ratingColor(val: number, invert = false) {
  const base = invert
    ? ['', 'text-green-600', 'text-yellow-500', 'text-orange-500', 'text-red-500', 'text-red-700']
    : ['', 'text-red-500', 'text-orange-500', 'text-yellow-500', 'text-green-500', 'text-green-600'];
  return base[val] || 'text-zinc-400';
}

function zoneStyles(zone: string | null) {
  switch (zone) {
    case 'green': return { bg: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-700', icon: '🟢' };
    case 'yellow': return { bg: 'bg-yellow-50 border-yellow-200', badge: 'bg-yellow-100 text-yellow-700', icon: '🟡' };
    case 'red': return { bg: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-700', icon: '🔴' };
    default: return { bg: 'bg-zinc-50 border-zinc-200', badge: 'bg-zinc-100 text-zinc-500', icon: '⚪' };
  }
}

// ----- RatingPicker -----
function RatingPicker({
  label, value, onChange, type, invert = false,
}: {
  label: string; value: number; onChange: (v: number) => void;
  type: 'energy' | 'soreness' | 'stress' | 'mood' | 'sleep' | 'nutrition'; invert?: boolean;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs font-bold uppercase text-zinc-500 tracking-wide">{label}</label>
        {value > 0 && (
          <span className={`text-xs font-bold ${ratingColor(value, invert)}`}>
            {value}/5 — {ratingLabel(value, type)}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(value === n ? 0 : n)}
            className={`flex-1 h-8 rounded text-xs font-bold border transition-all ${
              value === n
                ? 'bg-primary text-white border-primary'
                : 'bg-zinc-50 text-zinc-400 border-zinc-200 hover:border-zinc-400'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

// ----- NumberInput -----
function NumberInput({
  label, value, onChange, unit, placeholder, step = 1, min = 0,
}: {
  label: string; value: string; onChange: (v: string) => void;
  unit?: string; placeholder?: string; step?: number; min?: number;
}) {
  return (
    <div>
      <label className="text-xs font-bold uppercase text-zinc-500 tracking-wide block mb-1">{label}</label>
      <div className="flex items-center border border-zinc-200 rounded bg-white overflow-hidden focus-within:border-primary transition-colors">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          step={step}
          min={min}
          className="flex-1 px-3 py-2 text-sm font-medium bg-transparent outline-none"
        />
        {unit && <span className="px-3 text-xs font-bold text-zinc-400 bg-zinc-50 border-l border-zinc-200 py-2">{unit}</span>}
      </div>
    </div>
  );
}

// ----- Main Page -----
export default function HealthPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [tab, setTab] = useState<'morning' | 'evening'>('morning');
  const [todayRow, setTodayRow] = useState<HealthRow | null>(null);
  const [history, setHistory] = useState<HealthRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  // Morning fields
  const [weight, setWeight] = useState('');
  const [sleepHours, setSleepHours] = useState('');
  const [sleepQuality, setSleepQuality] = useState(0);
  const [restingHr, setRestingHr] = useState('');
  const [hrv, setHrv] = useState('');
  const [energy, setEnergy] = useState(0);
  const [soreness, setSoreness] = useState(0);
  const [stress, setStress] = useState(0);
  const [mood, setMood] = useState(0);

  // Evening fields
  const [steps, setSteps] = useState('');
  const [activeKcal, setActiveKcal] = useState('');
  const [waterOz, setWaterOz] = useState('');
  const [nutritionRating, setNutritionRating] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetch(`/api/health/log?date=${today}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.row) {
          const r: HealthRow = d.row;
          setTodayRow(r);
          // Pre-fill
          if (r.weight_lbs) setWeight(String(r.weight_lbs));
          if (r.sleep_hours) setSleepHours(String(r.sleep_hours));
          if (r.sleep_quality) setSleepQuality(r.sleep_quality);
          if (r.resting_hr) setRestingHr(String(r.resting_hr));
          if (r.hrv) setHrv(String(r.hrv));
          if (r.energy_level) setEnergy(r.energy_level);
          if (r.soreness_level) setSoreness(r.soreness_level);
          if (r.stress_level) setStress(r.stress_level);
          if (r.mood) setMood(r.mood);
          if (r.steps) setSteps(String(r.steps));
          if (r.active_kcal_day) setActiveKcal(String(r.active_kcal_day));
          if (r.water_oz) setWaterOz(String(r.water_oz));
          if (r.nutrition_rating) setNutritionRating(r.nutrition_rating);
          if (r.notes) setNotes(r.notes);
        }
      })
      .catch(console.error);

    fetch('/api/health/log?history=7')
      .then((r) => r.json())
      .then((d) => setHistory(d.rows || []))
      .catch(console.error);
  }, [today]);

  const handleSave = async () => {
    setSaving(true);
    setSavedMsg('');
    try {
      const payload: Record<string, unknown> = { sourceDate: today };

      if (tab === 'morning') {
        if (weight) payload.weightLbs = Number(weight);
        if (sleepHours) payload.sleepHours = Number(sleepHours);
        if (sleepQuality) payload.sleepQuality = sleepQuality;
        if (restingHr) payload.restingHr = Number(restingHr);
        if (hrv) payload.hrv = Number(hrv);
        if (energy) payload.energyLevel = energy;
        if (soreness) payload.sorenessLevel = soreness;
        if (stress) payload.stressLevel = stress;
        if (mood) payload.mood = mood;
      } else {
        if (steps) payload.steps = Number(steps);
        if (activeKcal) payload.activeKcalDay = Number(activeKcal);
        if (waterOz) payload.waterOz = Number(waterOz);
        if (nutritionRating) payload.nutritionRating = nutritionRating;
        if (notes) payload.notes = notes;
      }

      console.log('Saving health data:', payload);

      const res = await fetch('/api/health/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Response data:', data);

      if (data.ok) {
        setSavedMsg(`✓ Saved! Readiness: ${data.readiness.score}/100 (${data.readiness.zone})`);
        // Refresh today's row
        const refreshed = await fetch(`/api/health/log?date=${today}`).then((r) => r.json());
        if (refreshed.row) setTodayRow(refreshed.row);
      } else {
        setSavedMsg(data.error || '⚠️ Failed to save. Try again.');
      }
    } catch (err: any) {
      console.error('Save error:', err);
      setSavedMsg(`⚠️ Error: ${err.message || 'Network error'}`);
    } finally {
      setSaving(false);
    }
  };

  const zone = zoneStyles(todayRow?.readiness_zone ?? null);

  return (
    <div className="p-6 pb-32">
      {/* Header */}
      <header className="mb-6 flex items-center gap-3">
        <Link href="/" className="p-1 -ml-1 text-zinc-400 hover:text-primary">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display font-bold text-2xl tracking-tighter uppercase">Health Log</h1>
          <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
        </div>
        {todayRow?.readiness_score != null && (
          <div className={`ml-auto flex items-center gap-1.5 text-xs font-bold uppercase px-3 py-1.5 rounded border ${zone.badge} ${zone.bg}`}>
            <span>{zone.icon}</span>
            <span>{todayRow.readiness_score}/100</span>
          </div>
        )}
      </header>

      {/* Today's Readiness Summary */}
      {todayRow && (
        <section className={`mb-5 border rounded-md p-4 ${zone.bg}`}>
          <div className="flex items-center gap-2 mb-2">
            <Brain size={16} className="text-zinc-500" />
            <h2 className="font-display font-bold text-base uppercase">Today's Readiness</h2>
          </div>
          <div className="grid grid-cols-4 gap-3 text-center text-xs">
            <div>
              <p className="text-zinc-400 font-medium">Score</p>
              <p className="font-display font-bold text-xl">{todayRow.readiness_score ?? '–'}</p>
            </div>
            <div>
              <p className="text-zinc-400 font-medium">Sleep</p>
              <p className="font-display font-bold text-xl">{todayRow.sleep_hours ?? '–'}<span className="text-xs font-normal">h</span></p>
            </div>
            <div>
              <p className="text-zinc-400 font-medium">HRV</p>
              <p className="font-display font-bold text-xl">{todayRow.hrv ?? '–'}</p>
            </div>
            <div>
              <p className="text-zinc-400 font-medium">RHR</p>
              <p className="font-display font-bold text-xl">{todayRow.resting_hr ?? '–'}</p>
            </div>
          </div>
          {(todayRow.energy_level || todayRow.soreness_level || todayRow.stress_level) && (
            <div className="flex gap-4 mt-3 pt-3 border-t border-zinc-200/60 text-xs text-zinc-500">
              {todayRow.energy_level && <span>⚡ Energy {todayRow.energy_level}/5</span>}
              {todayRow.soreness_level && <span>💪 Soreness {todayRow.soreness_level}/5</span>}
              {todayRow.stress_level && <span>🧠 Stress {todayRow.stress_level}/5</span>}
              {todayRow.mood && <span>😊 Mood {todayRow.mood}/5</span>}
            </div>
          )}
        </section>
      )}

      {/* Tab Switcher */}
      <div className="flex rounded-md border border-zinc-200 overflow-hidden mb-5">
        <button
          className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all ${
            tab === 'morning' ? 'bg-primary text-white' : 'bg-white text-zinc-400 hover:bg-zinc-50'
          }`}
          onClick={() => setTab('morning')}
        >
          <Sun size={14} /> Morning
        </button>
        <button
          className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all ${
            tab === 'evening' ? 'bg-primary text-white' : 'bg-white text-zinc-400 hover:bg-zinc-50'
          }`}
          onClick={() => setTab('evening')}
        >
          <Moon size={14} /> Evening
        </button>
      </div>

      {/* Morning Form */}
      {tab === 'morning' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <NumberInput label="Weight" value={weight} onChange={setWeight} unit="lbs" placeholder="185" step={0.5} />
            <NumberInput label="Sleep" value={sleepHours} onChange={setSleepHours} unit="hrs" placeholder="7.5" step={0.5} />
            <NumberInput label="Resting HR" value={restingHr} onChange={setRestingHr} unit="bpm" placeholder="55" />
            <NumberInput label="HRV" value={hrv} onChange={setHrv} unit="ms" placeholder="65" />
          </div>

          <div className="h-px bg-zinc-100" />

          <RatingPicker label="Sleep Quality" value={sleepQuality} onChange={setSleepQuality} type="sleep" />
          <RatingPicker label="Energy Level" value={energy} onChange={setEnergy} type="energy" />
          <RatingPicker label="Muscle Soreness" value={soreness} onChange={setSoreness} type="soreness" invert />
          <RatingPicker label="Stress Level" value={stress} onChange={setStress} type="stress" invert />
          <RatingPicker label="Mood" value={mood} onChange={setMood} type="mood" />
        </div>
      )}

      {/* Evening Form */}
      {tab === 'evening' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <NumberInput label="Steps" value={steps} onChange={setSteps} placeholder="8500" />
            <NumberInput label="Active Calories" value={activeKcal} onChange={setActiveKcal} unit="kcal" placeholder="450" />
            <NumberInput label="Water Intake" value={waterOz} onChange={setWaterOz} unit="oz" placeholder="80" />
          </div>

          <div className="h-px bg-zinc-100" />

          <RatingPicker label="Nutrition Quality" value={nutritionRating} onChange={setNutritionRating} type="nutrition" />

          <div>
            <label className="text-xs font-bold uppercase text-zinc-500 tracking-wide block mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything to flag for coaching... stress, diet, injuries, life stuff."
              rows={3}
              className="w-full border border-zinc-200 rounded px-3 py-2 text-sm bg-white outline-none focus:border-primary transition-colors resize-none"
            />
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="mt-6">
        {savedMsg && (
          <p className={`text-xs font-bold mb-3 text-center ${savedMsg.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>
            {savedMsg}
          </p>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary text-white py-3 rounded font-display font-bold text-sm uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : `Save ${tab === 'morning' ? 'Morning' : 'Evening'} Check-in`}
        </button>
      </div>

      {/* 7-Day History */}
      {history.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display font-bold text-base uppercase text-secondary border-b border-zinc-200 pb-2 mb-4">
            7-Day History
          </h2>
          <div className="space-y-2">
            {history.map((row) => {
              const z = zoneStyles(row.readiness_zone);
              const date = new Date(row.source_date + 'T12:00:00');
              return (
                <div key={row.source_date} className={`border rounded-md p-3 ${z.bg}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-500 uppercase">
                      {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex items-center gap-2">
                      {row.readiness_score != null && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${z.badge}`}>
                          {z.icon} {row.readiness_score}/100
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-zinc-500 flex-wrap">
                    {row.weight_lbs && <span>⚖️ {row.weight_lbs} lbs</span>}
                    {row.sleep_hours && <span>💤 {row.sleep_hours}h</span>}
                    {row.hrv && <span>💓 HRV {row.hrv}</span>}
                    {row.resting_hr && <span>❤️ {row.resting_hr} bpm</span>}
                    {row.energy_level && <span>⚡ E{row.energy_level}</span>}
                    {row.soreness_level && <span>💪 S{row.soreness_level}</span>}
                    {row.steps && <span>🚶 {Number(row.steps).toLocaleString()}</span>}
                  </div>
                  {row.notes && (
                    <p className="mt-2 text-xs text-zinc-400 italic line-clamp-2">"{row.notes}"</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
