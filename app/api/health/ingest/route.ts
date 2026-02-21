import { NextResponse } from 'next/server';
import { calculateReadiness } from '@/lib/readiness';
import { saveHealthDaily, saveHealthWorkout } from '@/lib/db';

type IngestBody = {
  sourceDate?: string;
  weightKg?: number;
  sleepHours?: number;
  restingHr?: number;
  hrv?: number;
  steps?: number;
  workout?: {
    workoutType?: string;
    durationMin?: number;
    avgHr?: number;
    maxHr?: number;
    activeKcal?: number;
  };
};

export async function POST(req: Request) {
  try {
    const token = process.env.HEALTH_INGEST_TOKEN;
    const auth = req.headers.get('authorization') || '';

    if (!token) {
      return NextResponse.json({ error: 'HEALTH_INGEST_TOKEN not configured' }, { status: 500 });
    }

    if (auth !== `Bearer ${token}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as IngestBody;
    const sourceDate = body.sourceDate || new Date().toISOString().slice(0, 10);

    const readiness = calculateReadiness({
      sleepHours: body.sleepHours,
      restingHr: body.restingHr,
      hrv: body.hrv,
      steps: body.steps,
    });

    await saveHealthDaily({
      sourceDate,
      weightKg: body.weightKg,
      sleepHours: body.sleepHours,
      restingHr: body.restingHr,
      hrv: body.hrv,
      steps: body.steps,
      readinessScore: readiness.score,
      readinessZone: readiness.zone,
    });

    if (body.workout) {
      await saveHealthWorkout({
        sourceDate,
        workoutType: body.workout.workoutType,
        durationMin: body.workout.durationMin,
        avgHr: body.workout.avgHr,
        maxHr: body.workout.maxHr,
        activeKcal: body.workout.activeKcal,
      });
    }

    return NextResponse.json({ ok: true, readiness });
  } catch (err) {
    console.error('health ingest failed', err);
    return NextResponse.json({ error: 'Failed to ingest health data' }, { status: 500 });
  }
}
