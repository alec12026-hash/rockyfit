import Link from 'next/link';
import { WEEKS } from '@/lib/program';
import { ArrowRight, TrendingUp } from 'lucide-react';

export default function Home() {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  // Feature 2: Stock Market Analytics (Mock Data)
  const benchTrend = [225, 230, 230, 235, 240, 245]; // Trending up
  
  return (
    <div className="p-6 pb-24">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="font-display font-bold text-3xl tracking-tighter uppercase">ROCKYFIT</h1>
          <p className="text-secondary text-sm font-medium tracking-wide uppercase">{dateStr}</p>
        </div>
        <div className="h-8 w-8 bg-primary rounded-full"></div>
      </header>

      {/* Feature 2: Analytics Dashboard */}
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
          
          {/* Simple CSS Chart */}
          <div className="h-24 flex items-end gap-2 border-b border-zinc-100 pb-1">
            {benchTrend.map((val, i) => {
              const height = ((val - 200) / 60) * 100; // Normalize for chart
              return (
                <div key={i} className="flex-1 flex flex-col items-center group relative">
                   {/* Tooltip */}
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
          {WEEKS.map((week) => (
            <Link key={week.id} href={`/week/${week.number}`}>
              <div className="group bg-surface border border-zinc-200 p-5 rounded-md hover:border-primary transition-all shadow-subtle active:scale-[0.99]">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-accent uppercase tracking-wider mb-1 block">Week {week.number}</span>
                    <h3 className="font-display font-bold text-xl uppercase text-primary group-hover:text-black">Hypertrophy Phase 2</h3>
                  </div>
                  <ArrowRight size={20} className="text-zinc-300 group-hover:text-primary transition-colors" />
                </div>
                <div className="mt-3 flex gap-1">
                  {['M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={i} className="h-1 flex-1 bg-zinc-100 rounded-full overflow-hidden">
                      <div className="h-full bg-accent w-0 group-hover:w-full transition-all duration-500 delay-100" style={{ width: i < 3 ? '100%' : '0%' }}></div>
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
