'use client';

import Link from 'next/link';
import { WEEKS } from '@/lib/program';
import { ArrowRight, TrendingUp, TrendingDown, Brain, Calendar, Activity } from 'lucide-react';
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

interface ProgramData {
  useDefault: boolean;
  programName?: string;
  programData?: any;
}

interface WeekData {
  id: string;
  number: number;
  days: Array<{
    id: string;
    title: string;
    focus: string;
    exercises: any[];
  }>;
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
  const [programData, setProgramData] = useState<ProgramData | null>(null);
  const [programWeeks, setProgramWeeks] = useState<WeekData[]>([]);

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

    // Fetch program data
    fetch('/api/program/active')
      .then(res => res.json())
      .then(data => {
        setProgramData(data);
        if (!data.useDefault && data.programData) {
          // Convert user's program to weeks format
          const weeksCount = data.programData.weeks || 4;
          const daysPerWeek = data.programData.daysPerWeek || 3;
          const days = data.programData.days || [];
          
          const convertedWeeks: WeekData[] = [];
          
          for (let w = 0; w < Math.min(weeksCount, 4); w++) {
            const weekDays = [];
            
            for (let d = 0; d < daysPerWeek; d++) {
              const dayData = days[d % days.length];
              if (!dayData) continue;
              
              weekDays.push({
                id: `w${w + 1}_d${d}`,
                title: dayData.name || `Day ${d + 1}`,
                focus: (dayData.muscleGroups || []).join(', '),
                exercises: dayData.exercises || []
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
          
          setProgramWeeks(convertedWeeks);
        }
      })
      .catch(console.error);
  }, []);

  const [activeLift, setActiveLift] = useState<'bench_press' | 'squat' | 'deadlift'>('bench_press');
  const [liftChartData, setLiftChartData] = useState<{ week: number; weight: number }[]>([]);
  const [liftLoading, setLiftLoading] = useState(true);

  useEffect(() => {
    setLiftLoading(true);
    fetch(`/api/progress/chart?exerciseId=${activeLift}&type=1rm`)
      .then(r => r.json())
      .then(d => {
        const raw = (d.data || []).slice(-8);
        const mapped = raw.map((pt: any, i: number) => ({
          week: i + 1,
          weight: pt.max_weight || Math.round(pt.estimated_1rm || 0),
        }));
        setLiftChartData(mapped);
      })
      .catch(() => setLiftChartData([]))
      .finally(() => setLiftLoading(false));
  }, [activeLift]);

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

      {/* Performance Card with SVG Line Chart */}
      <section className="mb-8">
        <div className="bg-surface border border-zinc-200 p-4 rounded-md shadow-subtle">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display font-bold text-xl uppercase">Est. 1RM Trend</h3>
            <div className="flex gap-2">
              {(['bench_press', 'squat', 'deadlift'] as const).map((lift) => (
                <button
                  key={lift}
                  onClick={() => setActiveLift(lift)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-sm uppercase transition-colors ${
                    activeLift === lift ? 'bg-accent text-black' : 'bg-zinc-100 text-zinc-400'
                  }`}
                >
                  {lift.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Area */}
          <div className="h-[120px] border-b border-zinc-100 pb-1">
            {liftLoading ? (
              <div className="h-full flex flex-col justify-end gap-1">
                <div className="h-8 bg-zinc-100 animate-pulse rounded-sm"></div>
                <div className="h-12 bg-zinc-100 animate-pulse rounded-sm"></div>
                <div className="h-6 bg-zinc-100 animate-pulse rounded-sm"></div>
              </div>
            ) : liftChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-xs text-zinc-400 text-center">No data yet — complete a workout to start tracking</p>
              </div>
            ) : (
              (() => {
                const CHART_W = 300;
                const CHART_H = 100;
                const PAD = { top: 20, right: 10, bottom: 20, left: 10 };
                const plotW = CHART_W - PAD.left - PAD.right;
                const plotH = CHART_H - PAD.top - PAD.bottom;
                const weeks = [1, 2, 3, 4, 5, 6, 7, 8];
                const weights = liftChartData.map(d => d.weight).filter(Boolean);
                const minW = weights.length ? Math.min(...weights) * 0.98 : 0;
                const maxW = weights.length ? Math.max(...weights) * 1.02 : 300;
                const xPos = (week: number) => PAD.left + ((week - 1) / 7) * plotW;
                const yPos = (w: number) => PAD.top + plotH - ((w - minW) / (maxW - minW || 1)) * plotH;
                const points = liftChartData.map(d => `${xPos(d.week)},${yPos(d.weight)}`).join(' ');

                return (
                  <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} width="100%" className="overflow-visible">
                    {weeks.map(w => (
                      <text key={w} x={xPos(w)} y={CHART_H} textAnchor="middle" fontSize="8" fill="#a1a1aa" fontFamily="inherit">
                        W{w}
                      </text>
                    ))}
                    {liftChartData.length > 1 && (
                      <polyline points={points} fill="none" stroke="#DFFF00" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                    )}
                    {liftChartData.map(d => (
                      <g key={d.week}>
                        <circle cx={xPos(d.week)} cy={yPos(d.weight)} r="3" fill="#DFFF00" />
                        <text x={xPos(d.week)} y={yPos(d.weight) - 7} textAnchor="middle" fontSize="8" fontWeight="bold" fill="#111" fontFamily="inherit">
                          {d.weight}
                        </text>
                      </g>
                    ))}
                  </svg>
                );
              })()
            )}
          </div>

          {/* Strength Delta */}
          {liftChartData.length > 1 && (() => {
            const first = liftChartData[0].weight;
            const last = liftChartData[liftChartData.length - 1].weight;
            const delta = ((last - first) / first * 100).toFixed(1);
            const isPositive = Number(delta) > 0;

            return (
              <div className={`mt-4 flex items-center gap-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span className="text-xs font-bold uppercase">
                  {isPositive ? '+' : ''}{delta}% {isPositive ? 'Strength Increase' : 'Decrease'}
                </span>
              </div>
            );
          })()}

          {/* View Your Progress - inside same card */}
          <div className="border-t border-zinc-100 mt-4 pt-4">
            <Link href="/progress">
              <div className="flex items-center justify-between hover:border-primary active:scale-[0.99] transition-all -mx-1 px-1 -my-2 py-2 rounded-sm">
                <div className="flex items-center gap-3">
                  <TrendingUp size={20} className="text-zinc-500" />
                  <div>
                    <p className="font-display font-bold uppercase text-sm text-primary">View Your Progress</p>
                    <p className="text-xs text-secondary font-body">PRs, strength trends &amp; body comp</p>
                  </div>
                </div>
                <ArrowRight size={18} className="text-zinc-300" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="font-display font-semibold text-lg uppercase text-secondary border-b border-zinc-200 pb-2">Program Overview</h2>

        <div className="space-y-4">
          {(programWeeks.length > 0 ? programWeeks : WEEKS).slice(0, 4).map((week) => (
            <Link key={week.id} href={`/week/${week.number}`}>
              <div className="group bg-surface border border-zinc-200 p-5 rounded-md hover:border-primary transition-all shadow-subtle active:scale-[0.99]">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Week {week.number}</span>
                    <h3 className="font-display font-bold text-xl uppercase text-primary group-hover:text-black">
                      {programData?.programData?.programName || 'Hypertrophy Phase 2'}
                    </h3>
                  </div>
                  <ArrowRight size={20} className="text-zinc-300 group-hover:text-primary transition-colors" />
                </div>
                <div className="mt-3 flex gap-1">
                  {['M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={i} className="h-1 flex-1 bg-zinc-100 rounded-full overflow-hidden">
                      <div className="h-full bg-accent transition-all duration-500 delay-100" style={{ width: i < (programWeeks.length > 0 ? week.days.filter((d: any) => d.exercises && d.exercises.length > 0).length : 3) ? '100%' : '0%' }}></div>
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
