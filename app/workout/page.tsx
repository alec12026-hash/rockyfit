'use client';

import Link from 'next/link';
import { WEEKS, type Week } from '@/lib/program';
import { ArrowLeft, ArrowRight, Dumbbell } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ProgramData {
  useDefault: boolean;
  programName?: string;
  programData?: any;
}

export default function WorkoutIndexPage() {
  const [programData, setProgramData] = useState<ProgramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [weeks, setWeeks] = useState<Week[]>(WEEKS);

  useEffect(() => {
    // Fetch user's active program
    fetch('/api/program/active')
      .then(res => res.json())
      .then(data => {
        setProgramData(data);
        
        if (!data.useDefault && data.programData) {
          // Convert user's program to weeks format
          const weeksCount = data.programData.weeks || 4;
          const daysPerWeek = data.programData.daysPerWeek || 3;
          const days = data.programData.days || [];
          
          const convertedWeeks: Week[] = [];
          
          for (let w = 0; w < weeksCount; w++) {
            const weekDays = [];
            
            for (let d = 0; d < daysPerWeek; d++) {
              const dayData = days[d % days.length];
              if (!dayData) continue;
              
              weekDays.push({
                id: `w${w + 1}_d${d}`,
                title: dayData.name || `Day ${d + 1}`,
                focus: (dayData.muscleGroups || []).join(', '),
                exercises: (dayData.exercises || []).map((ex: any, idx: number) => ({
                  id: `w${w + 1}_d${d}_${ex.name.toLowerCase().replace(/ /g, '_')}_${idx}`,
                  name: ex.name,
                  sets: ex.sets,
                  reps: ex.reps,
                  rest: ex.rest,
                  notes: ex.rationale
                }))
              });
            }
            
            // Add rest day
            weekDays.push({
              id: `w${w + 1}_rest`,
              title: 'Rest',
              focus: 'Recovery',
              exercises: []
            });
            
            convertedWeeks.push({
              id: `week_${w + 1}`,
              number: w + 1,
              days: weekDays
            });
          }
          
          setWeeks(convertedWeeks);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const currentWeek = weeks[0];
  const programName = programData?.programData?.programName || 'Hypertrophy Phase 2';

  return (
    <div className="p-6 pb-24 min-h-screen bg-background">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/" className="p-2 -ml-2 text-secondary hover:text-primary">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-display font-bold text-2xl uppercase">Workouts</h1>
      </div>

      {!programData?.useDefault && programData?.programName && (
        <section className="mb-4 bg-primary/10 border border-primary/20 rounded-md p-3">
          <p className="text-xs text-secondary uppercase font-bold">Your Program</p>
          <p className="font-display font-bold text-primary">{programData.programName}</p>
        </section>
      )}

      <section className="mb-6 bg-surface border border-zinc-200 rounded-md p-4 shadow-subtle">
        <div className="flex items-center gap-2 mb-2">
          <Dumbbell size={18} className="text-zinc-500" />
          <h2 className="font-display font-bold uppercase">Jump back in</h2>
        </div>
        <p className="text-sm text-secondary mb-3">Start from your current program week.</p>
        {loading ? (
          <p className="text-sm text-secondary">Loading...</p>
        ) : (
          <Link href={`/week/${currentWeek?.number || 1}`} className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
            Open Week {currentWeek?.number || 1} <ArrowRight size={14} />
          </Link>
        )}
      </section>

      <section className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-secondary">Loading program...</div>
        ) : (
          weeks.map((week) => (
            <Link key={week.id} href={`/week/${week.number}`} className="block bg-white border border-zinc-200 rounded-md p-4 hover:border-primary transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase font-bold text-zinc-500">Week {week.number}</p>
                  <p className="font-display font-bold uppercase text-primary">{programName}</p>
                </div>
                <ArrowRight size={18} className="text-zinc-300" />
              </div>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
