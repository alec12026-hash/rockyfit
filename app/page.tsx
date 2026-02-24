'use client';

import Link from 'next/link';
import { WEEKS } from '@/lib/program';
import { ArrowRight, TrendingUp, Brain, Calendar, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';

interface CoachData {
  coachMessage: string;
  suggestedIntensity: string;
  suggestedChanges: string[];
  readiness: { score: number; zone: string; sleepHours: number } | null;
  recentWorkouts: number;
  weeklyVolume: number;
}

interface ScheduleData {
  recommendation: string;
  message: string;
  adjustment: string;
  nextWorkout: { id: string; title: string; focus: string; week: number } | null;
  canTrain: boolean;
}

export default function Home() {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const [coachData, setCoachData] = useState<CoachData | null>(null);
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingReport, setPendingReport] = useState(false);
  const [coachingTime, setCoachingTime] = useState('9:00 PM');

  useEffect(() => {
    // Load coaching time from settings
    const stored = localStorage.getItem('rockyfit_settings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.coaching_report_time) {
          // Convert "21:00" → "9:00 PM"
          const [h, m] = parsed.coaching_report_time.split(':').map(Number);
          const suffix = h >= 12 ? 'PM' : 'AM';
          const hour = h % 12 || 12;
          setCoachingTime(`${hour}:${String(m).padStart(2, '0')} ${suffix}`);
        }
      } catch (_) {}
    }

    // Fetch coach data
    fetch('/api/coach/daily')
      .then(res => res.json())
      .then(data => setCoachData(data))
      .catch(console.error);

    // Fetch smart schedule
    fetch('/api/schedule/smart')
      .then(res => res.json())
      .then(data => setScheduleData(data))
      .catch(console.error)
      .finally(() => setLoading(false));

    // Feature 7: Check if there's a pending coaching report for today
    fetch('/api/workout/history')
      .then(res => res.json())
      .then((sessions: any[]) => {
        if (!Array.isArray(sessions)) return;
        const hasPending = sessions.some(s => {
          const sessionDate = s.completed_at ? s.completed_at.slice(0, 10) : '';
          return sessionDate === todayStr && s.coaching_report_sent === false;
        });
        setPendingReport(hasPending);
      })
      .catch(console.error);
  }, []);

  const benchTrend = [225, 230, 230, 235, 240, 245];

  const getZoneColor = (zone: string) => {
    switch (zone) {
      case 'green': return 'bg-green-100 text-green-700';
      case 'yellow': return 'bg-yellow-100 text-yellow-700';
      case 'red': return 'bg-red-100 text-red-700';
      default: return 'bg-zinc-100 text-zinc-500';
    }
  };

  const getReadinessGradient = (zone: string) => {
    switch (zone) {
      case 'green': return 'bg-gradient-to-br from-green-50 to-white';
      case 'yellow': return 'bg-gradient-to-br from-yellow-50 to-white';
      case 'red': return 'bg-gradient-to-br from-red-50 to-white';
      default: return 'bg-surface';
    }
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'push': return 'text-green-400 bg-green-900/30 border-green-700/50';
      case 'reduced': return 'text-red-400 bg-red-900/30 border-red-700/50';
      case 'moderate': return 'text-yellow-400 bg-yellow-900/30 border-yellow-700/50';
      default: return 'text-zinc-400 bg-zinc-800 border-zinc-700';
    }
  };

  return (
    <div className="p-6 pb-24">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="font-display font-bold text-3xl tracking-tighter uppercase">ROCKYFIT</h1>
          <p className="text-secondary text-sm font-medium tracking-wide uppercase">{dateStr}</p>
        </div>
        <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
          <Brain size={16} className="text-white" />
        </div>
      </header>

      {/* AI Coach Section */}
      <section className="mb-6 bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-md p-4 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Brain size={18} className="text-accent" />
          <h2 className="font-display font-bold text-lg uppercase">Rocky's Coaching</h2>
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ml-auto ${getIntensityColor(coachData?.suggestedIntensity || '')}`}>
            {coachData?.suggestedIntensity || 'Loading...'}
          </span>
        </div>

        {loading ? (
          <p className="text-zinc-400 text-sm">Analyzing your data...</p>
        ) : (
          <>
            <p className="text-zinc-200 text-sm leading-relaxed mb-3">
              {coachData?.coachMessage || 'Connect Apple Health to get personalized coaching.'}
            </p>

            {coachData?.suggestedChanges && coachData.suggestedChanges.length > 0 && (
              <div className="space-y-1">
                {coachData.suggestedChanges.slice(0, 2).map((change, i) => (
                  <p key={i} className="text-xs text-zinc-300 flex items-start gap-2">
                    <span className="text-accent">•</span> {change}
                  </p>
                ))}
              </div>
            )}

            <div className="flex gap-4 mt-3 pt-3 border-t border-zinc-700 text-xs text-zinc-400">
              <span>📊 {coachData?.recentWorkouts || 0} workouts this week</span>
              <span>⚖️ {coachData?.weeklyVolume ? Math.round(coachData.weeklyVolume / 1000) + 'k' : '--'} lbs volume</span>
            </div>
          </>
        )}
      </section>

      {/* Feature 7: Pending Coaching Report */}
      {pendingReport && (
        <section className="mb-6 border border-zinc-200 bg-zinc-50 rounded-md p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain size={18} className="text-primary animate-pulse" />
            <h2 className="font-display font-bold text-base uppercase">Coaching Report</h2>
            <span className="ml-auto text-[10px] font-bold bg-zinc-200 text-zinc-600 px-2 py-0.5 rounded uppercase">Pending</span>
          </div>
          <p className="text-sm text-secondary">
            Rocky is analyzing today's session. Your coaching report will arrive on Telegram at {coachingTime}.
          </p>
        </section>
      )}

      {/* Smart Schedule Recommendation */}
      {scheduleData && scheduleData.recommendation !== 'unknown' && (
        <section className={`mb-6 border rounded-md p-4 ${scheduleData.canTrain ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={18} className={scheduleData.canTrain ? 'text-green-600' : 'text-yellow-600'} />
            <h2 className="font-display font-bold text-lg uppercase">Today's Plan</h2>
          </div>
          <p className="text-sm mb-1">{scheduleData.message}</p>
          <p className="text-xs font-bold text-secondary">{scheduleData.adjustment}</p>

          {scheduleData.nextWorkout && (
            <Link href={`/workout/${scheduleData.nextWorkout.id}`} className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
              <Activity size={14} /> Start {scheduleData.nextWorkout.title} →
            </Link>
          )}
        </section>
      )}

      {/* Recovery Readiness — with subtle gradient (Feature 8) */}
      <section className={`mb-6 border border-zinc-200 rounded-md p-4 shadow-subtle ${getReadinessGradient(coachData?.readiness?.zone || '')}`}>
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg uppercase">Recovery Readiness</h2>
          <span className={`text-xs font-bold uppercase px-2 py-1 rounded-sm ${getZoneColor(coachData?.readiness?.zone || '')}`}>
            {coachData?.readiness?.zone || 'No Data'}
          </span>
        </div>
        <p className="text-4xl font-display font-bold mt-2 tracking-tighter">
          {coachData?.readiness?.score ?? '--'}<span className="text-xl text-secondary">/100</span>
        </p>
        <p className="text-xs text-secondary mt-1">
          {coachData?.readiness
            ? `Sleep ${coachData.readiness.sleepHours ?? '--'}h · HRV synced from Apple Health`
            : 'Upload Apple Health data to unlock daily recommendations.'}
        </p>
      </section>

      {/* Analytics Dashboard */}
      <section className="mb-8">
        <h2 className="font-display font-semibold text-lg uppercase text-secondary border-b border-zinc-200 pb-2 mb-4">Performance</h2>
        <div className="bg-surface border border-zinc-200 p-4 rounded-md shadow-subtle">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display font-bold text-xl uppercase">Est. 1RM Trend</h3>
            <div className="flex gap-2">
              <span className="text-[10px] font-bold bg-accent text-black px-2 py-1 rounded-sm uppercase">Bench</span>
              <span className="text-[10px] font-bold bg-zinc-100 text-zinc-400 px-2 py-1 rounded-sm uppercase">Squat</span>
              <span className="text-[10px] font-bold bg-zinc-100 text-zinc-400 px-2 py-1 rounded-sm uppercase">Deadlift</span>
            </div>
          </div>

          <div className="h-24 flex items-end gap-2 border-b border-zinc-100 pb-1">
            {benchTrend.map((val, i) => {
              const height = ((val - 200) / 60) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center group relative">
                  <span className="absolute -top-6 text-[10px] font-bold bg-primary text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {val}
                  </span>
                  <div
                    className={`w-full rounded-t-sm transition-all duration-500 ${i === benchTrend.length - 1 ? 'bg-accent' : 'bg-zinc-200'}`}
                    style={{ height: `${height}%` }}
                  ></div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase">Week 1</span>
            <span className="text-[10px] font-bold text-zinc-400 uppercase">Week 6</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-green-600">
            <TrendingUp size={16} />
            <span className="text-xs font-bold uppercase">+8.8% Strength Increase</span>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="font-display font-semibold text-lg uppercase text-secondary border-b border-zinc-200 pb-2">Program Overview</h2>

        <div className="space-y-4">
          {WEEKS.slice(0, 4).map((week) => (
            <Link key={week.id} href={`/week/${week.number}`}>
              <div className="group bg-surface border border-zinc-200 p-5 rounded-md hover:border-primary transition-all shadow-subtle active:scale-[0.99]">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Week {week.number}</span>
                    <h3 className="font-display font-bold text-xl uppercase text-primary group-hover:text-black">Hypertrophy Phase 2</h3>
                  </div>
                  <ArrowRight size={20} className="text-zinc-300 group-hover:text-primary transition-colors" />
                </div>
                <div className="mt-3 flex gap-1">
                  {['M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={i} className="h-1 flex-1 bg-zinc-100 rounded-full overflow-hidden">
                      <div className="h-full bg-accent transition-all duration-500 delay-100" style={{ width: i < 3 ? '100%' : '0%' }}></div>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
