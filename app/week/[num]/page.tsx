'use client';

import { WEEKS, type Week, type WorkoutDay } from '@/lib/program';
import { ArrowLeft, ArrowRight, Calendar, ArrowLeftRight } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, use } from 'react';

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export default function WeekPage({ params }: { params: Promise<{ num: string }> }) {
  const resolvedParams = use(params);
  const weekNum = parseInt(resolvedParams.num, 10);

  const [allWeeks, setAllWeeks] = useState<Week[]>(WEEKS);
  const [days, setDays] = useState<WorkoutDay[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentWeek = allWeeks.find((w) => w.number === weekNum) || WEEKS[0];

  useEffect(() => {
    let mounted = true;

    fetch('/api/program/structure')
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        const weeks: Week[] = Array.isArray(data?.weeks) && data.weeks.length > 0 ? data.weeks : WEEKS;
        setAllWeeks(weeks);

        const week = weeks.find((w) => w.number === weekNum) || weeks[0];
        if (week) {
          setDays(week.days);

          const saved = localStorage.getItem(`rockyfit_week_${weekNum}_schedule`);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed) && parsed.length === week.days.length) {
                const normalizedDays: WorkoutDay[] = parsed
                  .map((rawDay: any, idx: number) => {
                    const rawId = typeof rawDay === 'string' ? rawDay : rawDay?.id;
                    const exact = week.days.find((d) => d.id === rawId);
                    if (exact) return exact;
                    const suffixMatch = week.days.find((d) => d.id.endsWith(`_${rawId}`));
                    if (suffixMatch) return suffixMatch;
                    return week.days[idx];
                  })
                  .filter(Boolean);

                if (normalizedDays.length === week.days.length) {
                  setDays(normalizedDays);
                }
              }
            } catch (e) {
              console.error('Failed to parse schedule', e);
            }
          }
        }
      })
      .catch((e) => {
        console.error('Failed to fetch program structure', e);
        const fallback = WEEKS.find((w) => w.number === weekNum) || WEEKS[0];
        setDays(fallback.days);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [weekNum]);

  const moveDay = (fromIndex: number, direction: 'up' | 'down') => {
    const newDays = [...days];
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= newDays.length) return;

    [newDays[fromIndex], newDays[toIndex]] = [newDays[toIndex], newDays[fromIndex]];
    setDays(newDays);
    localStorage.setItem(`rockyfit_week_${weekNum}_schedule`, JSON.stringify(newDays));
  };

  return (
    <div className="pb-24 min-h-screen bg-background">
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 -ml-2 text-secondary hover:text-primary">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-display font-bold text-xl uppercase">Week {currentWeek?.number || weekNum}</h1>
        </div>
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className={`p-2 rounded-sm transition-colors ${isEditMode ? 'bg-accent text-black' : 'text-secondary hover:bg-zinc-100'}`}
        >
          <ArrowLeftRight size={20} />
        </button>
      </div>

      <div className="p-6 space-y-4">
        {loading && <div className="text-sm text-secondary">Loading week...</div>}

        {isEditMode && (
          <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded mb-4 font-medium border border-blue-100">
            Tap arrows to move workouts. Changes save automatically.
          </div>
        )}

        {days.map((day, index) => (
          <div key={day.id} className="relative">
            {day.exercises.length > 0 ? (
              <Link href={isEditMode ? '#' : `/workout/${day.id}`} className={isEditMode ? 'pointer-events-none' : ''}>
                <div className={`bg-surface p-4 rounded-md border shadow-subtle flex items-center justify-between group transition-all ${isEditMode ? 'border-dashed border-zinc-300 opacity-90' : 'border-zinc-200 hover:border-accent hover:shadow-md active:scale-[0.99]'}`}>
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center justify-center bg-zinc-50 w-12 h-12 rounded-sm border border-zinc-100 shrink-0">
                      <span className="text-[10px] font-bold text-secondary uppercase">{DAY_LABELS[index] || `D${index + 1}`}</span>
                      <Calendar size={14} className="text-zinc-300 mt-1" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg uppercase text-primary">{day.title}</h3>
                      <p className="text-xs text-secondary font-medium uppercase tracking-wide">{day.focus}</p>
                    </div>
                  </div>
                  {!isEditMode && <ArrowRight size={18} className="text-zinc-300 group-hover:text-accent transition-colors" />}
                </div>
              </Link>
            ) : (
              <div className="bg-zinc-50 p-4 rounded-md border border-zinc-100 flex items-center gap-4 opacity-60">
                <div className="flex flex-col items-center justify-center bg-white w-12 h-12 rounded-sm border border-zinc-100 shrink-0">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">{DAY_LABELS[index] || `D${index + 1}`}</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg uppercase text-zinc-400">Rest Day</h3>
                  <p className="text-xs text-zinc-400">Recovery</p>
                </div>
              </div>
            )}

            {isEditMode && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-20">
                <button
                  onClick={() => moveDay(index, 'up')}
                  disabled={index === 0}
                  className="p-2 bg-white shadow-md rounded-full border border-zinc-200 disabled:opacity-30 hover:bg-zinc-50"
                >
                  <ArrowLeft size={14} className="rotate-90" />
                </button>
                <button
                  onClick={() => moveDay(index, 'down')}
                  disabled={index === days.length - 1}
                  className="p-2 bg-white shadow-md rounded-full border border-zinc-200 disabled:opacity-30 hover:bg-zinc-50"
                >
                  <ArrowLeft size={14} className="-rotate-90" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
