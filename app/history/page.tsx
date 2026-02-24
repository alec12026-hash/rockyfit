'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Dumbbell, ChevronRight } from 'lucide-react';

export default function HistoryPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/workout/history')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSessions(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatId = (id: string) => {
    // w1_d1_upper_body -> Week 1 Day 1 Upper Body
    if (!id) return 'Unknown Workout';
    const parts = id.split('_');
    if (parts.length >= 3) {
      const w = parts[0].replace('w', '');
      const d = parts[1].replace('d', '');
      const name = parts.slice(2).join(' ').toUpperCase();
      return `W${w}D${d}: ${name}`;
    }
    return id.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <div className="pb-24 bg-background min-h-screen">
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-zinc-200 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="p-2 -ml-2 text-secondary hover:text-primary">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-display font-bold text-xl uppercase">Workout History</h1>
      </div>

      <div className="p-6 space-y-4">
        {loading ? (
          <p className="text-zinc-400 text-center py-10">Loading history...</p>
        ) : sessions.length === 0 ? (
          <p className="text-zinc-400 text-center py-10">No workouts logged yet.</p>
        ) : (
          sessions.map((session) => (
            <Link key={session.id} href={`/history/${session.id}`}>
              <div className="bg-white border border-zinc-200 rounded-md p-4 shadow-sm active:scale-[0.98] transition-all hover:border-primary group">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-display font-bold text-base text-primary group-hover:text-zinc-600 transition-colors">
                      {formatId(session.workout_id)}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-secondary mt-1">
                      <Calendar size={12} />
                      {formatDate(session.completed_at)}
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-zinc-300 group-hover:text-primary" />
                </div>
                
                <div className="flex gap-4 mt-3 pt-3 border-t border-zinc-50">
                  <div>
                    <span className="block text-[10px] font-bold text-zinc-400 uppercase">Volume</span>
                    <span className="font-mono text-sm font-bold text-primary">
                      {session.total_volume ? Math.round(session.total_volume / 1000) + 'k' : '0'} lbs
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-zinc-400 uppercase">Sets</span>
                    <span className="font-mono text-sm font-bold text-primary">
                      {session.sets?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
