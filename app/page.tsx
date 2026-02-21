import Link from 'next/link';
import { WEEKS } from '@/lib/program';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  // Assume user is on Week 1 for demo
  const currentWeek = WEEKS[0];

  return (
    <div className="p-6 pb-24">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="font-display font-bold text-3xl tracking-tighter uppercase">ROCKYFIT</h1>
          <p className="text-secondary text-sm font-medium tracking-wide uppercase">{dateStr}</p>
        </div>
        <div className="h-8 w-8 bg-primary rounded-full"></div>
      </header>

      <section className="space-y-6">
        <h2 className="font-display font-semibold text-lg uppercase text-secondary border-b border-zinc-200 pb-2">Program Overview</h2>
        
        <div className="space-y-4">
          {WEEKS.map((week) => (
            <Link key={week.id} href={`/week/${week.number}`}>
              <div className="group bg-surface border border-zinc-200 p-5 rounded-md hover:border-primary transition-all shadow-subtle active:scale-[0.99]">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-accent uppercase tracking-wider mb-1 block">Week {week.number}</span>
                    <h3 className="font-display font-bold text-xl uppercase text-primary group-hover:text-black">Hypertrophy Phase 1</h3>
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
