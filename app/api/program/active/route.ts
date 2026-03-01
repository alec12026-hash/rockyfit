import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';

// GET /api/program/active - Get user's active program
export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    
    // For Alec (user_id=1), return useDefault since he uses hardcoded lib/program.ts
    if (userId === 1) {
      return NextResponse.json({ useDefault: true });
    }

    // Ensure user_programs table exists
    await sql`
      CREATE TABLE IF NOT EXISTS user_programs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        program_name VARCHAR(255),
        program_data JSONB NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Query for user's active program
    const { rows } = await sql`
      SELECT program_name, program_data, created_at
      FROM user_programs
      WHERE user_id = ${userId} AND is_active = TRUE
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (rows.length === 0) {
      // No program found for this user
      return NextResponse.json({ useDefault: true });
    }

    const program = rows[0];
    
    return NextResponse.json({
      useDefault: false,
      programName: program.program_name,
      programData: program.program_data,
      createdAt: program.created_at
    });

  } catch (error) {
    console.error('Error fetching active program:', error);
    return NextResponse.json({ useDefault: true });
  }
}
