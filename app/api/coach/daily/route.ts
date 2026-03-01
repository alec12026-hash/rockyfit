import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';

// GET /api/coach/daily - Get daily coaching recommendation
export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    
    // Get latest health data (user-specific)
    const healthData = await sql`
      SELECT * FROM health_daily 
      WHERE user_id = ${userId}
      ORDER BY source_date DESC 
      LIMIT 1
    `;

    // Get recent workouts (last 7 days, user-specific)
    const recentWorkouts = await sql`
      SELECT ws.*, 
        json_agg(json_build_object(
          'exercise_id', wse.exercise_id,
          'weight_lbs', wse.weight_lbs,
          'reps', wse.reps,
          'is_pr', wse.is_pr
        )) as sets
      FROM workout_sessions ws
      LEFT JOIN workout_sets wse ON wse.session_id = ws.id
      WHERE ws.user_id = ${userId} AND ws.completed_at > NOW() - INTERVAL '7 days'
      GROUP BY ws.id
      ORDER BY ws.completed_at DESC
    `;

    // Get current week in program (user-specific)
    const currentWeekRes = await sql`
      SELECT MAX(week_num) as current_week
      FROM workout_sessions
      WHERE user_id = ${userId}
    `;
    const currentWeek = (currentWeekRes.rows[0]?.current_week || 0) + 1;

    // Get personal records (user-specific)
    const prs = await sql`
      SELECT * FROM personal_records 
      WHERE user_id = ${userId}
      ORDER BY achieved_at DESC 
      LIMIT 10
    `;

    // Build context for coaching
    const health = healthData.rows[0];
    const workouts = recentWorkouts.rows;
    
    // Calculate readiness-based coaching
    let coachMessage = '';
    let suggestedIntensity = 'normal';
    let suggestedChanges: string[] = [];

    if (health) {
      const {
        readiness_score, readiness_zone, sleep_hours, hrv, resting_hr,
        energy_level, soreness_level, stress_level, mood,
        weight_lbs, water_oz, nutrition_rating, notes,
      } = health;

      // Base coaching by zone
      if (readiness_zone === 'red') {
        suggestedIntensity = 'reduced';
        coachMessage = `⚠️ RED ZONE (${readiness_score}/100) — your body is waving a red flag today.`;
        suggestedChanges = [
          'Reduce working weight by 10%',
          'Cut 1-2 sets per exercise',
          'Focus on form over intensity',
          'Consider a full rest day or active recovery',
        ];
      } else if (readiness_zone === 'yellow') {
        suggestedIntensity = 'moderate';
        coachMessage = `⚡ YELLOW ZONE (${readiness_score}/100) — proceed with intention.`;
        suggestedChanges = [
          'Keep weights at baseline',
          'Cap top sets at RPE 8-9',
          'Skip drop sets and forced reps',
          'Add an extra 1-2 min rest between heavy sets',
        ];
      } else {
        coachMessage = `🔥 GREEN ZONE (${readiness_score}/100) — you\'re primed to crush it!`;
        suggestedChanges = [
          'Hit your overload targets',
          'Add the extra rep or 5lbs where possible',
          'Push for PRs if the bar feels light',
        ];
      }

      // Sleep
      if (sleep_hours && sleep_hours < 6) {
        coachMessage += `\n\n💤 Only ${sleep_hours}h of sleep — prioritize rest tonight.`;
      } else if (sleep_hours && sleep_hours >= 8) {
        coachMessage += `\n\n💤 Solid ${sleep_hours}h sleep — well recovered.`;
      }

      // HRV context
      if (hrv) {
        if (hrv < 45) coachMessage += `\n\n💓 HRV at ${hrv}ms is suppressed — nervous system is taxed.`;
        else if (hrv >= 70) coachMessage += `\n\n💓 HRV ${hrv}ms — autonomic system is dialed in.`;
      }

      // Subjective stack
      if (energy_level && energy_level <= 2) {
        coachMessage += `\n\n⚡ Energy is low (${energy_level}/5) — warm up longer before lifting heavy.`;
        if (suggestedIntensity === 'normal') suggestedIntensity = 'moderate';
      }
      if (soreness_level && soreness_level >= 4) {
        coachMessage += `\n\n💪 Heavy soreness today (${soreness_level}/5) — consider prioritizing recovery work.`;
        suggestedChanges.push('Foam roll and stretch before session');
      }
      if (stress_level && stress_level >= 4) {
        coachMessage += `\n\n🧠 Stress is elevated (${stress_level}/5) — cortisol hurts gains. Keep session tight.`;
        suggestedChanges.push('Keep session under 60 min to minimize cortisol spike');
      }
      if (mood && mood >= 4) {
        coachMessage += `\n\n😊 Good vibes today (${mood}/5) — channel that energy.`;
      }

      // Nutrition and hydration
      if (nutrition_rating && nutrition_rating <= 2) {
        coachMessage += `\n\n🍽️ Nutrition was off yesterday (${nutrition_rating}/5) — prioritize protein intake today.`;
        suggestedChanges.push('Hit 1g/lb BW in protein today');
      }
      if (water_oz && water_oz < 60) {
        coachMessage += `\n\n💧 Low hydration yesterday (${water_oz}oz) — drink 16oz before training.`;
      }

      // Personal note from user
      if (notes) {
        coachMessage += `\n\n📝 You noted: "${notes}"`;
      }
    }

    // Add workout context
    if (workouts.length > 0) {
      const lastWorkout = workouts[0];
      const daysSinceLastWorkout = Math.floor((Date.now() - new Date(lastWorkout.completed_at).getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastWorkout >= 2) {
        coachMessage += `\n\n📅 It\'s been ${daysSinceLastWorkout} days since your last workout.`;
      }
    }

    // Check for PRs achieved recently
    const recentPRs = prs.rows.filter((pr: any) => {
      const prDate = new Date(pr.achieved_at);
      return (Date.now() - prDate.getTime()) / (1000 * 60 * 60 * 24) < 7;
    });

    if (recentPRs.length > 0) {
      coachMessage += `\n\n🏆 You hit ${recentPRs.length} PR(s) this week!`;
      const prList = recentPRs.slice(0, 3).map((pr: any) => pr.exercise_id).join(', ');
      if (prList) coachMessage += `: ${prList}`;
    }

    // Weekly volume check
    const weeklyVolume = workouts.reduce((acc: number, w: any) => acc + (w.total_volume || 0), 0);
    if (weeklyVolume > 50000) {
      coachMessage += `\n\n⚖️ High weekly volume (${Math.round(weeklyVolume / 1000)}k lbs). Make sure you\'re recovering.`;
    }

    return NextResponse.json({
      date: new Date().toISOString(),
      currentWeek,
      readiness: health ? {
        score: health.readiness_score,
        zone: health.readiness_zone,
        sleepHours: health.sleep_hours,
        hrv: health.hrv,
        restingHr: health.resting_hr
      } : null,
      suggestedIntensity,
      coachMessage,
      suggestedChanges,
      recentWorkouts: workouts.length,
      weeklyVolume: Math.round(weeklyVolume),
      recentPRs: recentPRs.length
    });

  } catch (error) {
    console.error('Coach error:', error);
    // Return fallback response
    return NextResponse.json({
      date: new Date().toISOString(),
      coachMessage: 'Ready to train! No health data yet - connect Apple Health to unlock personalized coaching.',
      suggestedIntensity: 'normal',
      suggestedChanges: ['Log your first workout to start tracking progress'],
      readiness: null
    });
  }
}
