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
  leanBM?: number;
  bodyFat?: number;
  BMI?: number;
  // Workout data (post-workout shortcut)
  workout?: {
    workoutType?: string;
    durationMin?: number;
    avgHr?: number;
    maxHr?: number;
    activeKcal?: number;
  };
  // Flat aliases supported from Shortcuts JSON body
  workoutType?: string;
  durationMin?: number;
  avgHR?: number;
  maxHR?: number;
  activeCalories?: number;
};

export async function POST(req: Request) {
  try {
    const auth = req.headers.get('authorization') || '';
    const altToken = (req.headers.get('x-health-token') || '').trim();
    const bearerRaw = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const bearer = (bearerRaw || altToken).trim().replace(/^"|"$/g, '');

    // Support multiple ingest tokens mapped to specific user emails
    const tokenBindings = [
      { token: process.env.HEALTH_INGEST_TOKEN, email: process.env.HEALTH_INGEST_TOKEN_EMAIL || 'alec12026@gmail.com' },
      { token: process.env.HEALTH_INGEST_TOKEN1, email: process.env.HEALTH_INGEST_TOKEN1_EMAIL },
      { token: process.env.HEALTH_INGEST_TOKEN2, email: process.env.HEALTH_INGEST_TOKEN2_EMAIL },
      { token: process.env.HEALTH_INGEST_TOKEN3, email: process.env.HEALTH_INGEST_TOKEN3_EMAIL },
    ].filter(b => b.token && b.email) as Array<{ token: string; email: string }>;

    if (tokenBindings.length === 0) {
      return NextResponse.json({ error: 'No HEALTH_INGEST_TOKEN* configured' }, { status: 500 });
    }

    const match = tokenBindings.find(b => b.token.trim() === bearer);
    if (!match) {
      return NextResponse.json({ error: 'Unauthorized', hint: 'Check Authorization Bearer token value exactly (no extra quotes/spaces).' }, { status: 401 });
    }

    // Resolve user id from email binding
    const { sql } = await import('@vercel/postgres');
    const userRes = await sql`SELECT id FROM users WHERE LOWER(email) = LOWER(${match.email}) LIMIT 1`;
    const userId = userRes.rows[0]?.id as number | undefined;
    if (!userId) {
      return NextResponse.json({ error: `No user found for token binding email: ${match.email}` }, { status: 400 });
    }

    const body = (await req.json()) as IngestBody;

    // Helper: coerce any value to a number or null (handles "", null, undefined, "3", etc)
    // Clamps to reasonable ranges to prevent numeric overflow
    // Helper: coerce any value to a number or null, round to 2 decimals to prevent precision overflow
    const num = (v: unknown, max: number = 999999): number | null => {
      if (v === null || v === undefined || v === '') return null;
      try {
        const s = String(v).trim();
        if (s === '') return null;
        const n = parseFloat(s);
        if (isNaN(n) || !isFinite(n)) return null;
        if (n > max || n < -max) return null;
        return Math.round(n * 100) / 100; // Round to 2 decimals
      } catch {
        return null;
      }
    };

    // Normalize sourceDate to YYYY-MM-DD regardless of input format (e.g. "Feb 23, 2026 at 12:36 PM")
    let sourceDate = new Date().toISOString().slice(0, 10);
    if (body.sourceDate) {
      const parsed = new Date(body.sourceDate);
      sourceDate = isNaN(parsed.getTime()) ? sourceDate : parsed.toISOString().slice(0, 10);
    }

    // Sanitize all numeric fields with reasonable max values
    const weightLbs = num(body.weightLbs, 1000);
    const weightKg = num(body.weightKg, 500) ?? (weightLbs != null ? Math.round((weightLbs / 2.20462) * 100) / 100 : null);
    // Apple Health sleep duration can come in various units from Shortcuts
    // >3,600,000 = milliseconds, >3600 = seconds, >24 = minutes, else hours
    const rawSleep = num(body.sleepHours, 100_000_000);
    let sleepHours: number | null = null;
    if (rawSleep != null) {
      if (rawSleep > 3_600_000) sleepHours = Math.round((rawSleep / 3_600_000) * 100) / 100; // ms → hours
      else if (rawSleep > 3600) sleepHours = Math.round((rawSleep / 3600) * 100) / 100;       // seconds → hours
      else if (rawSleep > 24) sleepHours = Math.round((rawSleep / 60) * 100) / 100;            // minutes → hours
      else sleepHours = rawSleep;                                                               // already hours
      // Safety clamp after conversion
      if (sleepHours > 24 || sleepHours < 0) sleepHours = null;
    }
    const sleepQuality = num(body.sleepQuality, 10);
    const restingHr = num(body.restingHr, 250);
    const hrv = num(body.hrv, 500);  // HRV in ms, max 500 is reasonable
    const steps = num(body.steps, 100000);
    const energyLevel = num(body.energyLevel, 10);
    const sorenessLevel = num(body.sorenessLevel, 10);
    const stressLevel = num(body.stressLevel, 10);
    const mood = num(body.mood, 10);
    const waterOz = num(body.waterOz, 500);
    const nutritionRating = num(body.nutritionRating, 10);
    const activeKcalDay = num(body.activeKcalDay, 10000);
    const leanBm = num(body.leanBM, 500);
    const bodyFat = num(body.bodyFat, 100);
    const bmi = num(body.BMI, 100);
    const notes = body.notes && String(body.notes).trim() !== '' ? String(body.notes) : null;

    // Workout payload can be nested or flat (Shortcuts-friendly)
    const workoutType = body.workout?.workoutType ?? (body.workoutType ? String(body.workoutType) : null);
    const durationMin = num(body.workout?.durationMin ?? body.durationMin, 600);
    const avgHr = num(body.workout?.avgHr ?? body.avgHR, 250);
    const maxHr = num(body.workout?.maxHr ?? body.maxHR, 300);
    const activeKcal = num(body.workout?.activeKcal ?? body.activeCalories, 10000);

    const hasMorningMetrics = [
      weightKg, weightLbs, sleepHours, sleepQuality, restingHr, hrv, steps,
      energyLevel, sorenessLevel, stressLevel, mood, waterOz, nutritionRating,
      activeKcalDay, leanBm, bodyFat, bmi, notes
    ].some(v => v !== null && v !== undefined);

    let adjustedScore: number | null = null;
    let adjustedZone: string | null = null;

    if (hasMorningMetrics) {
      // Readiness is objective-only and only computed from morning metrics
      const baseReadiness = calculateReadiness({
        sleepHours: sleepHours ?? undefined,
        restingHr: restingHr ?? undefined,
        hrv: hrv ?? undefined,
        steps: steps ?? undefined,
      });

      adjustedScore = baseReadiness.score;
      adjustedZone = baseReadiness.zone;

      await saveHealthDaily({
        sourceDate,
        userId,
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
        leanBm,
        bodyFat,
        bmi,
        notes,
        readinessScore: adjustedScore,
        readinessZone: adjustedZone,
      });
    }

    const hasWorkoutMetrics = [workoutType, durationMin, avgHr, maxHr, activeKcal].some(v => v !== null && v !== undefined);
    if (hasWorkoutMetrics) {
      await saveHealthWorkout({
        sourceDate,
        userId,
        workoutType: workoutType ?? undefined,
        durationMin: durationMin ?? undefined,
        avgHr: avgHr ?? undefined,
        maxHr: maxHr ?? undefined,
        activeKcal: activeKcal ?? undefined,
      });
    }

    return NextResponse.json({
      ok: true,
      userId,
      mappedEmail: match.email,
      readiness: adjustedScore != null && adjustedZone != null ? { score: adjustedScore, zone: adjustedZone } : null,
      received: {
        sourceDate,
        morning: { weightLbs, sleepHours, sleepQuality, restingHr, hrv, steps, energyLevel, sorenessLevel, stressLevel, mood, leanBm, bodyFat, bmi },
        workout: { workoutType, durationMin, avgHr, maxHr, activeKcal },
      },
    });
  } catch (err) {
    console.error('health ingest failed', err);
    return NextResponse.json({ error: 'Failed to ingest health data', detail: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
