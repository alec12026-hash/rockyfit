import { NextResponse } from 'next/server';
import { calculateReadiness } from '@/lib/readiness';
import { saveHealthDaily, getTodayHealthLog, getHealthHistory, getHealthWorkoutHistory } from '@/lib/db';

// POST /api/health/log - Manual check-in from the app UI (no auth required, same-origin)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Health log POST received:', body);
    
    // Check DB connection
    if (!process.env.POSTGRES_URL) {
      console.error('POSTGRES_URL not set');
      return NextResponse.json({ ok: false, error: 'Database not configured. Set POSTGRES_URL in Vercel.' }, { status: 500 });
    }
    
    const sourceDate: string = body.sourceDate || new Date().toISOString().slice(0, 10);

    // Convert lbs → kg if weight_lbs provided
    const weightLbs = body.weightLbs != null ? Number(body.weightLbs) : null;
    const weightKg = weightLbs != null ? Math.round((weightLbs / 2.20462) * 100) / 100 : null;

    // Readiness is objective-only (no manual prompt adjustments)
    const readiness = calculateReadiness({
      sleepHours: body.sleepHours != null ? Number(body.sleepHours) : undefined,
      restingHr: body.restingHr != null ? Number(body.restingHr) : undefined,
      hrv: body.hrv != null ? Number(body.hrv) : undefined,
      steps: body.steps != null ? Number(body.steps) : undefined,
    });

    const adjustedScore = readiness.score;
    const adjustedZone = readiness.zone;

    await saveHealthDaily({
      sourceDate,
      weightKg,
      weightLbs,
      sleepHours: body.sleepHours != null ? Number(body.sleepHours) : null,
      sleepQuality: body.sleepQuality != null ? Number(body.sleepQuality) : null,
      restingHr: body.restingHr != null ? Number(body.restingHr) : null,
      hrv: body.hrv != null ? Number(body.hrv) : null,
      steps: body.steps != null ? Number(body.steps) : null,
      energyLevel: body.energyLevel != null ? Number(body.energyLevel) : null,
      sorenessLevel: body.sorenessLevel != null ? Number(body.sorenessLevel) : null,
      stressLevel: body.stressLevel != null ? Number(body.stressLevel) : null,
      mood: body.mood != null ? Number(body.mood) : null,
      waterOz: body.waterOz != null ? Number(body.waterOz) : null,
      nutritionRating: body.nutritionRating != null ? Number(body.nutritionRating) : null,
      activeKcalDay: body.activeKcalDay != null ? Number(body.activeKcalDay) : null,
      leanBm: body.leanBM != null ? Number(body.leanBM) : null,
      bodyFat: body.bodyFat != null ? Number(body.bodyFat) : null,
      bmi: body.BMI != null ? Number(body.BMI) : null,
      notes: body.notes || null,
      readinessScore: adjustedScore,
      readinessZone: adjustedZone,
    });

    return NextResponse.json({
      ok: true,
      readiness: { score: adjustedScore, zone: adjustedZone },
    });
  } catch (err) {
    console.error('health log failed', err);
    return NextResponse.json({ error: 'Failed to save health log' }, { status: 500 });
  }
}

// GET /api/health/log?date=YYYY-MM-DD — return today's or a specific day's log
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const date = url.searchParams.get('date') || new URL(req.url).searchParams.get('date') || new Date().toISOString().slice(0, 10);
    const history = url.searchParams.get('history');

    if (history) {
      const days = Number(history) || 7;
      const [rows, workouts] = await Promise.all([
        getHealthHistory(days),
        getHealthWorkoutHistory(days),
      ]);

      const latestWorkoutByDate = new Map<string, any>();
      for (const w of workouts) {
        const key = String(w.source_date).slice(0, 10);
        if (!latestWorkoutByDate.has(key)) latestWorkoutByDate.set(key, w);
      }

      const merged = rows.map((r: any) => {
        const key = String(r.source_date).slice(0, 10);
        return {
          ...r,
          post_workout: latestWorkoutByDate.get(key) || null,
        };
      });

      return NextResponse.json({ rows: merged });
    }

    const row = await getTodayHealthLog(date);
    return NextResponse.json({ row });
  } catch (err) {
    console.error('health log GET failed', err);
    return NextResponse.json({ error: 'Failed to fetch health log' }, { status: 500 });
  }
}
