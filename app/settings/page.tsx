'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Clock, Scale, Timer, ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type SettingsState = {
  coaching_report_time: string;
  rest_timer_minutes: string;
  units: 'lbs' | 'kg';
  notifications_enabled: boolean;
};

const DEFAULT_SETTINGS: SettingsState = {
  coaching_report_time: '21:00',
  rest_timer_minutes: '2',
  units: 'lbs',
  notifications_enabled: false,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load from localStorage & API on mount
  useEffect(() => {
    // 1. Load from localStorage
    const stored = localStorage.getItem('rockyfit_settings');
    if (stored) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }

    // 2. Load from API
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          // Normalize boolean strings
          const parsedData = { ...data };
          if (parsedData.notifications_enabled === 'true') parsedData.notifications_enabled = true;
          if (parsedData.notifications_enabled === 'false') parsedData.notifications_enabled = false;
          
          setSettings(prev => {
            const newSettings = { ...prev, ...parsedData };
            localStorage.setItem('rockyfit_settings', JSON.stringify(newSettings));
            return newSettings;
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoaded(true));
  }, []);

  const handleSettingChange = (key: keyof SettingsState, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('rockyfit_settings', JSON.stringify(newSettings));

    // Debounce API save
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(() => {
      fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: String(value) })
      }).catch(console.error);
    }, 500);

    // Request notification permission if enabling
    if (key === 'notifications_enabled' && value === true) {
      if ('Notification' in window) {
        Notification.requestPermission().then(perm => {
          if (perm !== 'granted') {
            alert('Push notifications are blocked by your browser settings.');
            // Revert
            handleSettingChange('notifications_enabled', false);
          }
        });
      }
    }
  };

  return (
    <div className="pb-24 bg-background min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-zinc-200 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="p-2 -ml-2 text-secondary hover:text-primary">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-display font-bold text-xl uppercase">Settings</h1>
      </div>

      <div className="p-6 space-y-6">
        
        {/* Coaching Report Time */}
        <section className="bg-white border border-zinc-200 rounded-md p-4 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <div className="bg-primary/10 p-2 rounded-full text-primary">
              <Clock size={20} />
            </div>
            <div>
              <h2 className="font-display font-bold text-base uppercase">Coaching Report Time</h2>
              <p className="text-xs text-secondary mt-1">When Rocky analyzes your daily session.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="time" 
              value={settings.coaching_report_time}
              onChange={(e) => handleSettingChange('coaching_report_time', e.target.value)}
              className="flex-1 bg-zinc-50 border border-zinc-200 rounded p-3 font-mono text-lg font-bold text-center outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </section>

        {/* Rest Timer */}
        <section className="bg-white border border-zinc-200 rounded-md p-4 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <div className="bg-accent/20 p-2 rounded-full text-primary">
              <Timer size={20} />
            </div>
            <div>
              <h2 className="font-display font-bold text-base uppercase">Rest Timer</h2>
              <p className="text-xs text-secondary mt-1">Default duration between sets.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              value={settings.rest_timer_minutes}
              onChange={(e) => handleSettingChange('rest_timer_minutes', e.target.value)}
              className="w-20 bg-zinc-50 border border-zinc-200 rounded p-3 font-mono text-lg font-bold text-center outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <span className="font-bold text-secondary uppercase text-sm">Minutes</span>
          </div>
        </section>

        {/* Units */}
        <section className="bg-white border border-zinc-200 rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="bg-zinc-100 p-2 rounded-full text-zinc-600">
                <Scale size={20} />
              </div>
              <div>
                <h2 className="font-display font-bold text-base uppercase">Units</h2>
                <p className="text-xs text-secondary mt-1">Weight measurement system.</p>
              </div>
            </div>
            <div className="flex bg-zinc-100 rounded-lg p-1 border border-zinc-200">
              <button
                onClick={() => handleSettingChange('units', 'lbs')}
                className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition-colors ${settings.units === 'lbs' ? 'bg-white shadow-sm text-primary' : 'text-zinc-400'}`}
              >
                LBS
              </button>
              <button
                onClick={() => handleSettingChange('units', 'kg')}
                className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition-colors ${settings.units === 'kg' ? 'bg-white shadow-sm text-primary' : 'text-zinc-400'}`}
              >
                KG
              </button>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-white border border-zinc-200 rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="bg-blue-50 p-2 rounded-full text-blue-600">
                <Bell size={20} />
              </div>
              <div>
                <h2 className="font-display font-bold text-base uppercase">Notifications</h2>
                <p className="text-xs text-secondary mt-1">Get rest timer alerts & reports.</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.notifications_enabled}
                onChange={(e) => handleSettingChange('notifications_enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </section>

        <div className="pt-4 text-center">
          <p className="text-[10px] text-zinc-300 uppercase font-bold tracking-widest">RockyFit v2.0</p>
        </div>
      </div>
    </div>
  );
}
