'use client';

import { getWeek } from '@/lib/program';
import { ArrowLeft, ArrowRight, Calendar } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default function WeekPage({ params }: { params: { num: string } }) {
  const weekNum = parseInt(params.num);
  const week = getWeek(weekNum);

  if (!week) notFound();

  const days = [
    { key: 'monday', label: 'MON', ...week.days.monday },
    { key: 'tuesday', label: 'TUE', ...week.days.tuesday },
    { key: 'wednesday', label: 'WED', ...week.days.wednesday },
    { key: 'thursday', label: 'THU', ...week.days.thursday },
    { key: 'friday', label: 'FRI', ...week.days.friday },
    { key: 'saturday', label: 'SAT', ...week.days.saturday },
    { key: 'sunday', label: 'SUN', ...week.days.sunday },
  ];

  return (
    <div className="pb-24 min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 -ml-2 text-secondary hover:text-primary">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-display font-bold text-xl uppercase">Week {week.number}</h1>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {days.map((day) => (
          day.exercises.length > 0 ? (
            <Link key={day.key} href={\`/workout/\${day.id}\`}>
              <div className="bg-surface p-4 rounded-md border border-zinc-200 shadow-subtle hover:border-accent hover:shadow-md transition-all active:scale-[0.99] flex items-center justify-between group">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center justify-center bg-zinc-50 w-12 h-12 rounded-sm border border-zinc-100">
                    <span className="text-[10px] font-bold text-secondary uppercase">{day.label}</span>
                    <Calendar size={14} className="text-zinc-300 mt-1" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg uppercase text-primary group-hover:text-black">{day.title}</h3>
                    <p className="text-xs text-secondary font-medium uppercase tracking-wide">{day.focus}</p>
                  </div>
                </div>
                <ArrowRight size={18} className="text-zinc-300 group-hover:text-accent transition-colors" />
              </div>
            </Link>
          ) : (
            <div key={day.key} className="bg-zinc-50 p-4 rounded-md border border-zinc-100 flex items-center gap-4 opacity-60">
               <div className="flex flex-col items-center justify-center bg-white w-12 h-12 rounded-sm border border-zinc-100">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">{day.label}</span>
               </div>
               <div>
                  <h3 className="font-display font-bold text-lg uppercase text-zinc-400">Rest Day</h3>
                  <p className="text-xs text-zinc-400">Recovery</p>
               </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}
