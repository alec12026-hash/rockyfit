import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { WEEKS, type Week, type WorkoutDay, type Exercise } from '@/lib/program';

// Helper to convert generated program data to WEEKS format
function convertToWeeksFormat(programData: any): Week[] {
  const weeksCount = programData.weeks || 4;
  const daysPerWeek = programData.daysPerWeek || 3;
  const days = programData.days || [];

  // Build the week structure by repeating days
  const weeks: Week[] = [];
  
  for (let w = 0; w < weeksCount; w++) {
    const weekDays: WorkoutDay[] = [];
    
    for (let d = 0; d < daysPerWeek; d++) {
      const dayData = days[d % days.length];
      if (!dayData) continue;
      
      const exercises: Exercise[] = (dayData.exercises || []).map((ex: any, idx: number) => ({
        id: `w${w + 1}_d${d}_${ex.name.toLowerCase().replace(/ /g, '_')}_${idx}`,
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        rest: ex.rest,
        rpe: ex.rpe,
        notes: ex.rationale
      }));
      
      weekDays.push({
        id: `w${w + 1}_d${d}`,
        title: dayData.name || `Day ${d + 1}`,
        focus: (dayData.muscleGroups || []).join(', '),
        exercises
      });
    }
    
    // Add rest day
    weekDays.push({
      id: `w${w + 1}_rest`,
      title: 'Rest',
      focus: 'Recovery',
      exercises: []
    });
    
    weeks.push({
      id: `week_${w + 1}`,
      number: w + 1,
      days: weekDays
    });
  }
  
  return weeks;
}

// GET /api/program/structure - Get program structure in WEEKS format
export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    
    // For Alec (user_id=1), return hardcoded WEEKS
    if (userId === 1) {
      return NextResponse.json({
        useDefault: true,
        weeks: WEEKS
      });
    }

    // Query for user's active program
    const { rows } = await sql`
      SELECT program_data
      FROM user_programs
      WHERE user_id = ${userId} AND is_active = TRUE
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (rows.length === 0) {
      // No program found, return default
      return NextResponse.json({
        useDefault: true,
        weeks: WEEKS
      });
    }

    const programData = rows[0].program_data;
    const weeks = convertToWeeksFormat(programData);
    
    return NextResponse.json({
      useDefault: false,
      weeks
    });

  } catch (error) {
    console.error('Error fetching program structure:', error);
    // Fallback to default on error
    return NextResponse.json({
      useDefault: true,
      weeks: WEEKS
    });
  }
}
