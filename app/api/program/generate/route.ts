import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

// GET /api/program/generate - Generate new training block based on performance
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phase = searchParams.get('phase') || 'hypertrophy'; // hypertrophy, strength, peaking
    const weeks = parseInt(searchParams.get('weeks') || '6');

    // Get performance data from last block
    const recentWorkouts = await sql`
      SELECT 
        ws.workout_id,
        ws.week_num,
        ws.completed_at,
        ws.rating,
        wse.exercise_id,
        wse.weight_lbs,
        wse.reps,
        wse.rpe,
        wse.is_pr
      FROM workout_sessions ws
      JOIN workout_sets wse ON wse.session_id = ws.id
      WHERE ws.completed_at > NOW() - INTERVAL '42 days'
      ORDER BY ws.completed_at DESC
    `;

    // Get PRs
    const prs = await sql`
      SELECT exercise_id, MAX(value) as max_1rm, MAX(achieved_at) as last_pr_date
      FROM personal_records 
      WHERE record_type = '1rm'
      GROUP BY exercise_id
    `;

    // Analyze weak points
    const exerciseStats: Record<string, { avgWeight: number; avgReps: number; workouts: number; prs: number }> = {};
    for (const row of recentWorkouts.rows) {
      const exId = row.exercise_id;
      if (!exerciseStats[exId]) {
        exerciseStats[exId] = { avgWeight: 0, avgReps: 0, workouts: 0, prs: 0 };
      }
      exerciseStats[exId].avgWeight += row.weight_lbs || 0;
      exerciseStats[exId].avgReps += row.reps || 0;
      exerciseStats[exId].workouts++;
      if (row.is_pr) exerciseStats[exId].prs++;
    }

    // Calculate averages
    for (const exId of Object.keys(exerciseStats)) {
      const s = exerciseStats[exId];
      s.avgWeight = Math.round(s.avgWeight / s.workouts);
      s.avgReps = Math.round(s.avgReps / s.workouts);
    }

    // Determine weak points (exercises with lowest frequency or no PRs)
    const weakPoints: string[] = [];
    const strongPoints: string[] = [];
    
    for (const [exId, stats] of Object.entries(exerciseStats)) {
      if (stats.prs === 0 && stats.workouts >= 3) {
        weakPoints.push(exId);
      } else if (stats.prs > 0) {
        strongPoints.push(exId);
      }
    }

    // Generate program based on phase
    let program = {
      phase,
      duration: weeks,
      generatedAt: new Date().toISOString(),
      focus: '',
      weeklyStructure: [] as any[],
      progression: '',
      recommendations: [] as string[]
    };

    if (phase === 'hypertrophy') {
      program.focus = 'Muscle growth with moderate weights, higher volume';
      program.progression = 'Week-over-week: add 2.5-5lbs when hitting top rep ranges';
      program.weeklyStructure = [
        { day: 1, focus: 'Push (Chest/Triceps)', split: 'push_a' },
        { day: 2, focus: 'Pull (Back/Biceps)', split: 'pull_a' },
        { day: 3, focus: 'Legs (Quad-dominant)', split: 'legs_a' },
        { day: 4, push: 'Push (Shoulders/Triceps)', split: 'push_b' },
        { day: 5, focus: 'Pull (Width/Thickness)', split: 'pull_b' },
        { day: 6, focus: 'Legs (Hamstring-dominant)', split: 'legs_b' },
      ];
      program.recommendations = [
        'Aim for 8-12 reps on isolation, 6-8 on compounds',
        'Rest 60-90s on isolation, 2-3min on compounds',
        'Take each set within 1-2 reps of failure'
      ];
    } else if (phase === 'strength') {
      program.focus = 'Strength with heavier weights, lower reps';
      program.progression = 'Week-over-week: add 5-10lbs on main lifts';
      program.weeklyStructure = [
        { day: 1, focus: 'Upper Power', split: 'push_a' },
        { day: 2, focus: 'Lower Power', split: 'legs_a' },
        { day: 3, focus: 'Upper Hypertrophy', split: 'pull_a' },
        { day: 4, focus: 'Lower Power', split: 'legs_b' },
        { day: 5, focus: 'Upper Power', split: 'push_b' },
      ];
      program.recommendations = [
        'Main lifts: 3-5 reps at RPE 8-9',
        'Volume accessories: 3 sets x 10-12',
        'Rest 3-5 min on main lifts'
      ];
    }

    // Add weak point emphasis
    if (weakPoints.length > 0) {
      program.recommendations.unshift(`🎯 Focus on: ${weakPoints.slice(0, 3).join(', ')} - you've hit 0 PRs recently`);
    }

    // Add strong point maintenance
    if (strongPoints.length > 0) {
      program.recommendations.push(`💪 Maintain: ${strongPoints.slice(0, 3).join(', ')} - these are your strongest lifts`);
    }

    return NextResponse.json({
      program,
      analysis: {
        totalWorkoutsAnalyzed: recentWorkouts.rows.length,
        weakPoints,
        strongPoints,
        exerciseStats
      }
    });

  } catch (error) {
    console.error('Program generation error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate program',
      fallback: {
        phase: 'hypertrophy',
        focus: 'General muscle growth',
        weeklyStructure: [
          { day: 1, focus: 'Push' },
          { day: 2, focus: 'Pull' },
          { day: 3, focus: 'Legs' },
          { day: 4, focus: 'Push' },
          { day: 5, focus: 'Pull' },
          { day: 6, focus: 'Legs' },
        ]
      }
    }, { status: 500 });
  }
}
