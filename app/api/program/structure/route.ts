import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { WEEKS } from '@/lib/program';
import { buildWeeksFromProgram } from '@/lib/training-schedule';

// GET /api/program/structure - Get program structure in WEEKS format
export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    
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
    const weeks = buildWeeksFromProgram(programData);
    
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
