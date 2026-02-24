'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, Moon, Activity, Scale, Heart, Battery, Droplets, Footprints, Flame } from 'lucide-react';
import Link from 'next/link';

export default function HealthPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health/log?history=30')
      .then(res => res.json())
      .then(data => {
        if (data.rows) setLogs(data.rows);
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

  const getZoneColor = (zone: string) => {
    switch (zone?.toLowerCase()) {
      case 'green': return 'bg-green-100 text-green-700 border-green-200';
      case 'yellow': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'red': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-zinc-100 text-zinc-500 border-zinc-200';
    }
  };

  const toggleExpand = (date: string) => {
    setExpanded(expanded === date ? null : date);
  };

  return (
    <div className="pb-24 bg-background min-h-screen">
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-zinc-200 px-6 py-4">
        <h1 className="font-display font-bold text-xl uppercase">Health History</h1>
        <p className="text-xs text-secondary mt-1 flex items-center gap-1">
          <Activity size={12} className="text-accent" />
          Synced automatically via Apple Health
        </p>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-blue-50 border border-blue-100 rounded-md p-3 flex items-start gap-2 text-xs text-blue-800">
           <AlertCircle size={14} className="mt-0.5 shrink-0" />
           <p>Data syncs automatically from Apple Health via your Shortcuts setup.</p>
        </div>

        {loading ? (
          <p className="text-zinc-400 text-center py-10">Loading health data...</p>
        ) : logs.length === 0 ? (
          <div className="text-center py-10 px-6">
            <p className="text-zinc-400 mb-2">No health data yet.</p>
            <p className="text-xs text-zinc-300">Apple Health syncs automatically via your Shortcuts setup.</p>
          </div>
        ) : (
          logs.map((log) => {
            const isExpanded = expanded === log.source_date;
            return (
              <div key={log.source_date} className="bg-white border border-zinc-200 rounded-md shadow-sm overflow-hidden">
                <div 
                  onClick={() => toggleExpand(log.source_date)}
                  className="p-4 cursor-pointer active:bg-zinc-50 transition-colors"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-display font-bold text-base text-primary uppercase">
                      {formatDate(log.source_date)}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getZoneColor(log.readiness_zone)}`}>
                      Readiness: {log.readiness_score ?? '--'}
                    </span>
                  </div>

                  {/* Core Metrics Row */}
                  <div className="flex items-center justify-between text-xs text-secondary">
                    <div className="flex items-center gap-1">
                      <Moon size={12} className="text-indigo-400" />
                      <span className="font-mono font-bold text-primary">{log.sleep_hours ?? '-'}h</span>
                    </div>
                    <div className="w-px h-3 bg-zinc-200"></div>
                    <div className="flex items-center gap-1">
                      <Activity size={12} className="text-pink-400" />
                      <span className="font-mono font-bold text-primary">{log.hrv ?? '-'}ms</span>
                    </div>
                    <div className="w-px h-3 bg-zinc-200"></div>
                    <div className="flex items-center gap-1">
                      <Heart size={12} className="text-red-400" />
                      <span className="font-mono font-bold text-primary">{log.resting_hr ?? '-'}bpm</span>
                    </div>
                    <div className="w-px h-3 bg-zinc-200"></div>
                    <div className="flex items-center gap-1">
                      <Scale size={12} className="text-blue-400" />
                      <span className="font-mono font-bold text-primary">{log.weight_lbs ?? '-'}lbs</span>
                    </div>
                    
                    {isExpanded ? <ChevronUp size={16} className="text-zinc-300" /> : <ChevronDown size={16} className="text-zinc-300" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="bg-zinc-50 border-t border-zinc-200 p-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-400 font-bold uppercase">Energy</span>
                          <span className="font-mono font-bold text-primary">{log.energy_level ?? '-'}/5</span>
                        </div>
                        <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-400" style={{ width: `${(log.energy_level || 0) * 20}%` }}></div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-400 font-bold uppercase">Soreness</span>
                          <span className="font-mono font-bold text-primary">{log.soreness_level ?? '-'}/5</span>
                        </div>
                        <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                          <div className="h-full bg-red-400" style={{ width: `${(log.soreness_level || 0) * 20}%` }}></div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-400 font-bold uppercase">Stress</span>
                          <span className="font-mono font-bold text-primary">{log.stress_level ?? '-'}/5</span>
                        </div>
                        <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-400" style={{ width: `${(log.stress_level || 0) * 20}%` }}></div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-400 font-bold uppercase">Mood</span>
                          <span className="font-mono font-bold text-primary">{log.mood ?? '-'}/5</span>
                        </div>
                        <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                          <div className="h-full bg-green-400" style={{ width: `${(log.mood || 0) * 20}%` }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-zinc-200">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 text-secondary font-bold uppercase"><Footprints size={12} /> Steps</span>
                        <span className="font-mono font-bold text-primary">{log.steps?.toLocaleString() ?? '-'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                         <span className="flex items-center gap-2 text-secondary font-bold uppercase"><Flame size={12} /> Active Cal</span>
                         <span className="font-mono font-bold text-primary">{log.active_kcal_day ?? '-'} kcal</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                         <span className="flex items-center gap-2 text-secondary font-bold uppercase"><Droplets size={12} /> Water</span>
                         <span className="font-mono font-bold text-primary">{log.water_oz ?? '-'} oz</span>
                      </div>
                    </div>

                    {log.notes && (
                      <div className="mt-4 pt-3 border-t border-zinc-200">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Notes</p>
                        <p className="text-xs text-secondary italic">"{log.notes}"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
