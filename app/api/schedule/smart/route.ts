import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getWeek } from '@/lib/program';
import { getUserIdFromRequest } from '@/lib/auth';

// GET /api/schedule/smart - Get smart schedule recommendations
export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    
    // Get recent readiness scores (last 3 days) - user-specific
    const readinessData = await sql`
      SELECT source_date, readiness_score, readiness_zone, sleep_hours, hrv
      FROM health_daily 
      WHERE user_id = ${userId} AND source_date >= NOW() - INTERVAL '3 days'
      ORDER BY source_date DESC
    `;

    // Get upcoming scheduled workouts - user-specific
    const nextScheduled = await sql`
      SELECT ws.week_num, ws.day_num, ws.workout_id, ws.completed_at
      FROM workout_sessions ws
      WHERE ws.user_id = ${userId}
      ORDER BY ws.completed_at DESC
      LIMIT 1
    `;

    // Calculate recovery status
    const recentZones = readinessData.rows.map((r: any) => r.readiness_zone);
    const recentScores = readinessData.rows.map((r: any) => r.readiness_score).filter(Boolean);
    const avgScore = recentScores.length > 0 
      ? recentScores.reduce((a: number, b: number) => a + b, 0) / recentScores.length 
      : null;

    // Determine if rest is recommended
    let recommendation = 'train';
    let message = '';
    let adjustment = '';

    if (recentZones.filter(z => z === 'red').length >= 2) {
      recommendation = 'rest';
      message = 'Your body has been in red zone for 2+ days. Recommend full rest.';
      adjustment = 'Take today off. Light walking or stretching only.';
    } else if (recentZones.filter(z => z === 'red').length === 1) {
      recommendation = 'active_recovery';
      message = 'You hit red zone recently. Your body is stressed.';
      adjustment = 'Reduce workout to 60% volume. Skip heavy compounds.';
    } else if (recentZones.filter(z => z === 'yellow').length >= 2) {
      recommendation = 'reduce';
      message = 'Multiple yellow zone days. Cumulative fatigue building.';
      adjustment = 'Reduce weight by 5-10%, cut 1-2 sets per exercise.';
    } else if (avgScore && avgScore >= 75) {
      recommendation = 'push';
      message = 'You\'re primed! Great readiness over the past 3 days.';
      adjustment = 'Go for overload targets. Great day to hit PRs.';
    } else if (!avgScore) {
      recommendation = 'unknown';
      message = 'No health data yet. No recommendations available.';
      adjustment = 'Connect Apple Health to get personalized scheduling.';
    }

    // Get next workout in program
    const lastWeek = nextScheduled.rows[0]?.week_num || 0;
    const lastDay = nextScheduled.rows[0]?.day_num || 0;
    const nextWeek = lastDay >= 6 ? lastWeek + 1 : lastWeek;
    const nextDay = lastDay >= 6 ? 0 : lastDay + 1;
    
    const nextWorkout = getWeek(nextWeek)?.days[nextDay];

    return NextResponse.json({
      recommendation,
      message,
      adjustment,
      avgScore: avgScore ? Math.round(avgScore) : null,
      recentZones,
      nextWorkout: nextWorkout ? {
        id: nextWorkout.id,
        title: nextWorkout.title,
        focus: nextWorkout.focus,
        week: nextWeek,
        day: nextDay + 1
      } : null,
      canTrain: recommendation === 'push' || recommendation === 'train'
    });

  } catch (error) {
    console.error('Schedule error:', error);
    return NextResponse.json({
      recommendation: 'unknown',
      message: 'Unable to analyze schedule. Try again later.',
      canTrain: true
    });
  }
}
