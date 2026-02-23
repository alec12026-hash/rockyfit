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

    // Helper: coerce any value to a number or null (handles "", null, undefined, "3")
    const num = (v: unknown): number | null => {
      if (v === null || v === undefined || v === '') return null;
      const n = Number(v);
      return isNaN(n) ? null : n;
    };

    // Normalize sourceDate to YYYY-MM-DD regardless of input format (e.g. "Feb 23, 2026 at 12:36 PM")
    let sourceDate = new Date().toISOString().slice(0, 10);
    if (body.sourceDate) {
      const parsed = new Date(body.sourceDate);
      sourceDate = isNaN(parsed.getTime()) ? sourceDate : parsed.toISOString().slice(0, 10);
    }

    // Sanitize all numeric fields
    const weightLbs = num(body.weightLbs);
    const weightKg = num(body.weightKg) ?? (weightLbs != null ? Math.round((weightLbs / 2.20462) * 100) / 100 : null);
    const sleepHours = num(body.sleepHours);
    const sleepQuality = num(body.sleepQuality);
    const restingHr = num(body.restingHr);
    const hrv = num(body.hrv);
    const steps = num(body.steps);
    const energyLevel = num(body.energyLevel);
    const sorenessLevel = num(body.sorenessLevel);
    const stressLevel = num(body.stressLevel);
    const mood = num(body.mood);
    const waterOz = num(body.waterOz);
    const nutritionRating = num(body.nutritionRating);
    const activeKcalDay = num(body.activeKcalDay);
    const notes = body.notes && String(body.notes).trim() !== '' ? String(body.notes) : null;

    // Calculate readiness from objective biometrics
    const baseReadiness = calculateReadiness({
      sleepHours: sleepHours ?? undefined,
      restingHr: restingHr ?? undefined,
      hrv: hrv ?? undefined,
      steps: steps ?? undefined,
    });

    // Adjust score with subjective inputs
    let adjustedScore = baseReadiness.score;
    if (energyLevel != null) adjustedScore += (energyLevel - 3) * 4;     // -8 to +8
    if (sorenessLevel != null) adjustedScore -= (sorenessLevel - 1) * 3; // 0 to -12
    if (stressLevel != null) adjustedScore -= (stressLevel - 1) * 2;     // 0 to -8
    adjustedScore = Math.max(0, Math.min(100, Math.round(adjustedScore)));
    const adjustedZone = adjustedScore >= 75 ? 'green' : adjustedScore >= 55 ? 'yellow' : 'red';

    await saveHealthDaily({
      sourceDate,
      weightKg,
      weightLbs,
      sleepHours,
      sleepQuality,
      restingHr,
      hrv,
      steps,
      energyLevel,
      sorenessLevel,
      stressLevel,
      mood,
      waterOz,
      nutritionRating,
      activeKcalDay,
      notes,
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
      received: { sourceDate, weightLbs, sleepHours, sleepQuality, restingHr, hrv, steps, energyLevel, sorenessLevel, stressLevel, mood },
    });
  } catch (err) {
    console.error('health ingest failed', err);
    return NextResponse.json({ error: 'Failed to ingest health data', detail: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
