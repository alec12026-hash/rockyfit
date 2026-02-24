import { NextResponse } from 'next/server';
import { calculateReadiness } from '@/lib/readiness';
import { saveHealthDaily, getTodayHealthLog, getHealthHistory } from '@/lib/db';

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

    // Build readiness from whatever objective biometrics are provided
    const readiness = calculateReadiness({
      sleepHours: body.sleepHours != null ? Number(body.sleepHours) : undefined,
      restingHr: body.restingHr != null ? Number(body.restingHr) : undefined,
      hrv: body.hrv != null ? Number(body.hrv) : undefined,
      steps: body.steps != null ? Number(body.steps) : undefined,
    });

    // Boost/penalise readiness with subjective inputs
    let adjustedScore = readiness.score;
    if (body.energyLevel != null) {
      const e = Number(body.energyLevel); // 1–5
      adjustedScore += (e - 3) * 4; // -8 to +8
    }
    if (body.sorenessLevel != null) {
      const s = Number(body.sorenessLevel); // 1=no soreness, 5=very sore
      adjustedScore -= (s - 1) * 3; // 0 to -12
    }
    if (body.stressLevel != null) {
      const st = Number(body.stressLevel); // 1=no stress, 5=very stressed
      adjustedScore -= (st - 1) * 2; // 0 to -8
    }
    adjustedScore = Math.max(0, Math.min(100, Math.round(adjustedScore)));
    const adjustedZone = adjustedScore >= 75 ? 'green' : adjustedScore >= 55 ? 'yellow' : 'red';

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
      const rows = await getHealthHistory(Number(history) || 7);
      return NextResponse.json({ rows });
    }

    const row = await getTodayHealthLog(date);
    return NextResponse.json({ row });
  } catch (err) {
    console.error('health log GET failed', err);
    return NextResponse.json({ error: 'Failed to fetch health log' }, { status: 500 });
  }
}
