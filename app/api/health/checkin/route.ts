import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { calculateReadiness } from '@/lib/readiness';

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    const body = await req.json();
    
    const { sleepHours, energyLevel, sorenessLevel, mood, notes } = body;

    // Validate required fields
    if (typeof sleepHours !== 'number' || sleepHours < 0 || sleepHours > 24) {
      return NextResponse.json({ error: 'Invalid sleep hours' }, { status: 400 });
    }

    // Calculate readiness score based on check-in data
    const readiness = calculateReadiness({
      sleepHours,
      energyLevel: energyLevel ?? null,
      sorenessLevel: sorenessLevel ?? null,
      mood: mood ?? null,
    });

    // Get today's date
    const today = new Date().toISOString().slice(0, 10);

    // Save to health_daily using the existing function pattern
    const existing = await sql`
      SELECT id FROM health_daily 
      WHERE source_date = ${today} AND user_id = ${userId}
      LIMIT 1
    `;

    if (existing.rows.length > 0) {
      // Update existing record
      await sql`
        UPDATE health_daily SET
          sleep_hours = ${sleepHours},
          energy_level = ${energyLevel ?? null},
          soreness_level = ${sorenessLevel ?? null},
          mood = ${mood ?? null},
          notes = ${notes ?? null},
          readiness_score = ${readiness.score},
          readiness_zone = ${readiness.zone},
          updated_at = NOW()
        WHERE source_date = ${today} AND user_id = ${userId}
      `;
    } else {
      // Insert new record
      await sql`
        INSERT INTO health_daily (
          source_date, user_id, sleep_hours, energy_level, soreness_level, mood,
          notes, readiness_score, readiness_zone, updated_at
        )
        VALUES (
          ${today}, ${userId}, ${sleepHours}, ${energyLevel ?? null}, ${sorenessLevel ?? null},
          ${mood ?? null}, ${notes ?? null}, ${readiness.score}, ${readiness.zone}, NOW()
        )
      `;
    }

    return NextResponse.json({
      success: true,
      readinessScore: readiness.score,
      readinessZone: readiness.zone,
      recommendation: readiness.recommendation,
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json({ error: 'Failed to save check-in' }, { status: 500 });
  }
}
