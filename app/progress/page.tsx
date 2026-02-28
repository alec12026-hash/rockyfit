'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Dumbbell, Scale, ChevronRight } from 'lucide-react';

interface ExerciseTrend {
  exercise_id: string;
  max_1rm: number;
  total_workouts: number;
  last_pr: string | null;
}

interface ChartDataPoint {
  date: string;
  estimated_1rm?: number;
  max_weight?: number;
  volume?: number;
  total_volume?: number;
  total_sets?: number;
  avg_rpe?: number;
}

interface HealthLog {
  source_date: string;
  weight_lbs: number | null;
}

export default function ProgressPage() {
  const [trends, setTrends] = useState<ExerciseTrend[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'1rm' | 'volume'>('1rm');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([]);

  // Fetch exercise trends on mount
  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const res = await fetch('/api/progress/chart');
        const data = await res.json();
        if (data.trends) {
          setTrends(data.trends);
        }
      } catch (e) {
        console.error('Failed to fetch trends', e);
      } finally {
        setLoading(false);
      }
    };
    fetchTrends();
  }, []);

  // Fetch exercise detail data when selected
  useEffect(() => {
    if (!selectedExercise) return;
    
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/progress/chart?exerciseId=${selectedExercise}&type=${chartType}`);
        const data = await res.json();
        if (data.data) {
          setChartData(data.data);
        }
      } catch (e) {
        console.error('Failed to fetch chart data', e);
      }
    };
    fetchDetail();
  }, [selectedExercise, chartType]);

  // Fetch body weight data
  useEffect(() => {
    const fetchWeight = async () => {
      try {
        const res = await fetch('/api/health/log?history=14');
        const data = await res.json();
        if (data.rows) {
          setHealthLogs(data.rows);
        }
      } catch (e) {
        console.error('Failed to fetch health logs', e);
      }
    };
    fetchWeight();
  }, []);

  const formatExerciseName = (id: string) => {
    return id.replace(/_/g, ' ').toUpperCase();
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  // Get max value for sparkline scaling
  const getSparklineBars = (values: number[]) => {
    const max = Math.max(...values, 1);
    return values.map(v => (v / max) * 100);
  };

  // Exercise list view
  if (!selectedExercise) {
    return (
      <div className="p-6 pb-24 min-h-screen bg-background">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="p-2 -ml-2 text-secondary hover:text-primary">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-display font-bold text-2xl uppercase">Progress</h1>
        </div>

        {loading ? (
          <div className="text-center py-12 text-secondary font-body">Loading...</div>
        ) : (
          <div className="space-y-3">
            {trends.length === 0 && (
              <div className="bg-surface border border-zinc-200 rounded-md p-5 shadow-subtle">
                <p className="text-sm text-secondary">
                  No workout data yet. Finish some workouts to see your progress!
                </p>
              </div>
            )}

            {trends.map((trend) => {
              // Calculate mock sparkline data from max_1rm (in real app, would fetch historical)
              const sparklineValues = [trend.max_1rm * 0.9, trend.max_1rm * 0.95, trend.max_1rm, trend.max_1rm * 0.98];
              const bars = getSparklineBars(sparklineValues);
              
              return (
                <button
                  key={trend.exercise_id}
                  onClick={() => setSelectedExercise(trend.exercise_id)}
                  className="w-full bg-surface border border-zinc-200 rounded-md p-4 shadow-subtle hover:border-accent transition-colors text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display font-bold text-lg uppercase">
                      {formatExerciseName(trend.exercise_id)}
                    </h3>
                    <ChevronRight size={16} className="text-zinc-400" />
                  </div>
                  
                  <div className="flex items-center gap-4 mb-3">
                    <div className="bg-accent/20 px-2 py-1 rounded-sm">
                      <span className="text-xs font-bold text-primary">MAX 1RM</span>
                      <span className="ml-2 font-mono font-bold text-primary">{trend.max_1rm}lbs</span>
                    </div>
                    <div className="text-xs text-secondary font-bold uppercase">
                      {trend.total_workouts} workouts
                    </div>
                  </div>

                  {/* Sparkline */}
                  <div className="flex items-end gap-1 h-8 mb-1">
                    {bars.map((height, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-zinc-300 rounded-sm"
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>

                  {trend.last_pr && (
                    <p className="text-[10px] text-secondary uppercase font-bold tracking-wider">
                      Last PR: {formatDate(trend.last_pr)}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Exercise detail view
  const currentTrend = trends.find(t => t.exercise_id === selectedExercise);
  const maxValue = chartType === '1rm' 
    ? Math.max(...(chartData.map(d => d.estimated_1rm || d.max_weight || 0)), 1)
    : Math.max(...(chartData.map(d => d.total_volume || d.volume || 0)), 1);

  // Calculate stats
  const currentMax = chartType === '1rm'
    ? chartData[chartData.length - 1]?.estimated_1rm || chartData[chartData.length - 1]?.max_weight || 0
    : chartData.reduce((sum, d) => sum + (d.total_sets || 0), 0);
  const totalSets = chartData.reduce((sum, d) => sum + (d.total_sets || 0), 0);
  const avgRpe = chartData.length > 0
    ? chartData.reduce((sum, d) => sum + (d.avg_rpe || 0), 0) / chartData.length
    : 0;

  return (
    <div className="p-6 pb-24 min-h-screen bg-background">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => setSelectedExercise(null)} className="p-2 -ml-2 text-secondary hover:text-primary">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display font-bold text-xl uppercase">{formatExerciseName(selectedExercise)}</h1>
      </div>

      {/* Toggle tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setChartType('1rm')}
          className={`flex-1 py-3 font-display font-bold text-sm uppercase rounded-sm border transition-colors ${
            chartType === '1rm'
              ? 'bg-primary text-white border-primary'
              : 'bg-surface text-secondary border-zinc-200 hover:border-zinc-400'
          }`}
        >
          1RM Trend
        </button>
        <button
          onClick={() => setChartType('volume')}
          className={`flex-1 py-3 font-display font-bold text-sm uppercase rounded-sm border transition-colors ${
            chartType === 'volume'
              ? 'bg-primary text-white border-primary'
              : 'bg-surface text-secondary border-zinc-200 hover:border-zinc-400'
          }`}
        >
          Volume
        </button>
      </div>

      {/* Bar chart */}
      <div className="bg-surface border border-zinc-200 rounded-md p-4 shadow-subtle mb-6">
        <div className="flex items-end justify-between h-48 gap-2">
          {chartData.length === 0 && (
            <div className="w-full flex items-center justify-center text-secondary text-sm">
              No data available
            </div>
          )}
          {chartData.map((point, i) => {
            const value = chartType === '1rm' 
              ? (point.estimated_1rm || point.max_weight || 0)
              : (point.total_volume || point.volume || 0);
            const isHighest = value === maxValue && value > 0;
            const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
            
            return (
              <div key={i} className="flex-1 flex flex-col items-center h-full justify-end">
                <span className="text-[10px] font-mono text-primary mb-1">
                  {Math.round(value)}
                </span>
                <div
                  className={`w-full rounded-sm ${isHighest ? 'bg-accent' : 'bg-zinc-200'}`}
                  style={{ height: `${height}%`, minHeight: value > 0 ? '4px' : '0' }}
                />
                <span className="text-[8px] text-secondary mt-1 font-bold uppercase">
                  {formatDate(point.date)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-surface border border-zinc-200 rounded-md p-3 shadow-subtle">
          <p className="text-[10px] font-bold text-secondary uppercase mb-1">Current Max</p>
          <p className="font-mono font-bold text-lg text-primary">
            {chartType === '1rm' ? `${currentMax}lbs` : currentMax}
          </p>
        </div>
        <div className="bg-surface border border-zinc-200 rounded-md p-3 shadow-subtle">
          <p className="text-[10px] font-bold text-secondary uppercase mb-1">Total Sets</p>
          <p className="font-mono font-bold text-lg text-primary">{totalSets}</p>
        </div>
        <div className="bg-surface border border-zinc-200 rounded-md p-3 shadow-subtle">
          <p className="text-[10px] font-bold text-secondary uppercase mb-1">Avg RPE</p>
          <p className="font-mono font-bold text-lg text-primary">{avgRpe.toFixed(1)}</p>
        </div>
      </div>

      {/* Body Weight Section */}
      <div className="border-t border-zinc-200 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Scale size={18} className="text-zinc-500" />
          <h2 className="font-display font-bold uppercase text-lg">Body Weight</h2>
        </div>

        {healthLogs.length === 0 || !healthLogs.some(l => l.weight_lbs) ? (
          <div className="bg-surface border border-zinc-200 rounded-md p-5 shadow-subtle">
            <p className="text-sm text-secondary">
              Connect Apple Health to track body weight
            </p>
          </div>
        ) : (
          <div className="bg-surface border border-zinc-200 rounded-md p-4 shadow-subtle">
            {/* Line-style chart using bars */}
            <div className="flex items-end justify-between h-32 gap-1 mb-3">
              {healthLogs.slice(0, 14).map((log, i) => {
                const weights = healthLogs.map(l => l.weight_lbs).filter(Boolean) as number[];
                const maxW = Math.max(...weights, 1);
                const minW = Math.min(...weights, 1);
                const range = maxW - minW || 1;
                const height = log.weight_lbs ? ((log.weight_lbs - minW) / range) * 80 + 10 : 0;
                
                return (
                  <div key={i} className="flex-1 flex flex-col items-center h-full justify-end">
                    {log.weight_lbs && (
                      <>
                        <span className="text-[8px] font-mono text-primary mb-0.5">
                          {log.weight_lbs}
                        </span>
                        <div
                          className="w-full bg-zinc-400 rounded-sm"
                          style={{ height: `${height}%`, minHeight: '4px' }}
                        />
                        <span className="text-[6px] text-secondary mt-0.5 font-bold">
                          {formatDate(log.source_date)}
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-between text-xs text-secondary">
              <span className="font-bold">14-DAY RANGE</span>
              <span className="font-mono">
                {Math.min(...healthLogs.map(l => l.weight_lbs).filter(Boolean) as number[])} - 
                {Math.max(...healthLogs.map(l => l.weight_lbs).filter(Boolean) as number[])} lbs
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
