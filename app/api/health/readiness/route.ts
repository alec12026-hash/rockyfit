import { NextResponse } from 'next/server';
import { getLatestReadiness } from '@/lib/db';
import { calculateReadiness } from '@/lib/readiness';

export async function GET() {
  try {
    const latest = await getLatestReadiness();

    if (!latest) {
      const fallback = calculateReadiness({ sleepHours: 7, hrv: 55, restingHr: 60, steps: 8000 });
      return NextResponse.json({
        sourceDate: null,
        ...fallback,
        note: 'No Apple Health data yet. Using neutral baseline.'
      });
    }

    return NextResponse.json({
      sourceDate: latest.source_date,
      score: latest.readiness_score,
      zone: latest.readiness_zone,
      sleepHours: latest.sleep_hours,
      restingHr: latest.resting_hr,
      hrv: latest.hrv,
      steps: latest.steps,
      weightKg: latest.weight_kg,
    });
  } catch (err) {
    console.error('readiness fetch failed', err);
    return NextResponse.json({ error: 'Failed to fetch readiness' }, { status: 500 });
  }
}
