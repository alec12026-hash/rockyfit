import Link from 'next/link';
import { ArrowLeft, TrendingUp } from 'lucide-react';

export default function ProgressPage() {
  return (
    <div className="p-6 pb-24 min-h-screen bg-background">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/" className="p-2 -ml-2 text-secondary hover:text-primary">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-display font-bold text-2xl uppercase">Progress</h1>
      </div>

      <section className="bg-surface border border-zinc-200 rounded-md p-5 shadow-subtle">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={18} className="text-zinc-500" />
          <h2 className="font-display font-bold uppercase">Progress Tracking</h2>
        </div>
        <p className="text-sm text-secondary">
          Your trend dashboards are loading from workout history. For now, use the home screen chart and finish a workout to populate more data points.
        </p>
      </section>
    </div>
  );
}
