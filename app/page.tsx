import Link from 'next/link';
import { getRecommendedWorkout } from '@/lib/program';

export default function Home() {
  const today = new Date();
  const recommended = getRecommendedWorkout(today.getDay());
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="p-6">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="font-display font-bold text-3xl tracking-tighter uppercase">ROCKYFIT</h1>
          <p className="text-secondary text-sm font-medium tracking-wide uppercase">{dateStr}</p>
        </div>
        <div className="h-8 w-8 bg-primary rounded-full"></div>
      </header>

      <section className="mb-10">
        <h2 className="font-display font-semibold text-lg mb-4 uppercase text-secondary">Today's Protocol</h2>
        {recommended ? (
          <Link href={`/workout/${recommended.id}`}>
            <div className="bg-primary text-white p-6 rounded-md shadow-lifted active:scale-[0.98] transition-transform">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-display text-2xl font-bold uppercase">{recommended.title}</h3>
                <span className="text-accent text-xs font-bold px-2 py-1 border border-accent rounded-sm uppercase">Next Up</span>
              </div>
              <p className="text-zinc-400 text-sm mb-4 font-body">{recommended.focus}</p>
              <div className="flex gap-2">
                 <button className="bg-accent text-black font-display font-bold text-sm uppercase px-4 py-2 rounded-sm w-full">
                   Start Session
                 </button>
              </div>
            </div>
          </Link>
        ) : (
          <div className="bg-zinc-100 p-6 rounded-md border border-zinc-200">
            <h3 className="font-display text-xl font-bold uppercase text-zinc-400">Rest Day</h3>
            <p className="text-secondary text-sm">Recover. Hydrate. Sleep.</p>
          </div>
        )}
      </section>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display font-semibold text-lg uppercase text-secondary">Quick Select</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {['push_a', 'pull_a', 'legs_a'].map(id => (
            <Link key={id} href={`/workout/${id}`}>
              <div className="bg-surface border border-zinc-200 p-4 rounded-md hover:border-primary transition-colors">
                <span className="font-display font-bold uppercase block">{id.replace('_', ' ')}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      
      {/* AI Insight Teaser */}
      <div className="mt-8 p-4 bg-zinc-50 border-l-4 border-accent rounded-r-md">
        <h4 className="font-display font-bold text-sm uppercase mb-1">Coach Rocky</h4>
        <p className="text-xs text-secondary leading-relaxed">
          Last session your bench velocity slowed on set 3. Focus on explosive concentric today.
        </p>
      </div>
    </div>
  );
}
