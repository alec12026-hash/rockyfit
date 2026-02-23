import { NextResponse } from 'next/server';
import { calculateReadiness } from '@/lib/readiness';
import { saveHealthDaily, saveHealthWorkout } from '@/lib/db';

type IngestBody = {
  sourceDate?: string;
  // Objective biometrics (Apple Health)
  weightKg?: number;
  weightLbs?: number;
  sleepHours?: number;
  restingHr?: number;
  hrv?: number;
  steps?: number;
  activeKcalDay?: number;
  // Subjective ratings (1–5 from Ask for Input prompts)
  sleepQuality?: number;
  energyLevel?: number;
  sorenessLevel?: number;
  stressLevel?: number;
  mood?: number;
  waterOz?: number;
  nutritionRating?: number;
  notes?: string;
  // Workout data (post-workout shortcut)
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

    // Handle lbs → kg conversion
    const weightKg = body.weightKg ?? (body.weightLbs ? Math.round((body.weightLbs / 2.20462) * 100) / 100 : undefined);

    // Calculate readiness from objective biometrics
    const baseReadiness = calculateReadiness({
      sleepHours: body.sleepHours,
      restingHr: body.restingHr,
      hrv: body.hrv,
      steps: body.steps,
    });

    // Adjust score with subjective inputs
    let adjustedScore = baseReadiness.score;
    if (body.energyLevel != null) adjustedScore += (body.energyLevel - 3) * 4;   // -8 to +8
    if (body.sorenessLevel != null) adjustedScore -= (body.sorenessLevel - 1) * 3; // 0 to -12
    if (body.stressLevel != null) adjustedScore -= (body.stressLevel - 1) * 2;   // 0 to -8
    adjustedScore = Math.max(0, Math.min(100, Math.round(adjustedScore)));
    const adjustedZone = adjustedScore >= 75 ? 'green' : adjustedScore >= 55 ? 'yellow' : 'red';

    await saveHealthDaily({
      sourceDate,
      weightKg,
      weightLbs: body.weightLbs ?? null,
      sleepHours: body.sleepHours,
      sleepQuality: body.sleepQuality,
      restingHr: body.restingHr,
      hrv: body.hrv,
      steps: body.steps,
      energyLevel: body.energyLevel,
      sorenessLevel: body.sorenessLevel,
      stressLevel: body.stressLevel,
      mood: body.mood,
      waterOz: body.waterOz,
      nutritionRating: body.nutritionRating,
      activeKcalDay: body.activeKcalDay,
      notes: body.notes,
      readinessScore: adjustedScore,
      readinessZone: adjustedZone,
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

    return NextResponse.json({
      ok: true,
      readiness: { score: adjustedScore, zone: adjustedZone },
    });
  } catch (err) {
    console.error('health ingest failed', err);
    return NextResponse.json({ error: 'Failed to ingest health data', detail: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
