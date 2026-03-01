import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';

// GET /api/user/preferences - Get user preferences including email settings
export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    
    const result = await sql`
      SELECT email, email_coaching_enabled, email_coaching_schedule, telegram_chat_id
      FROM user_profiles
      WHERE user_id = ${userId}
    `;
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

// POST /api/user/preferences - Update user preferences
export async function POST(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = await request.json();
    
    const {
      email,
      email_coaching_enabled,
      email_coaching_schedule,
      telegram_chat_id
    } = body;
    
    // Update preferences
    await sql`
      UPDATE user_profiles
      SET 
        email = COALESCE(${email ?? null}, email),
        email_coaching_enabled = COALESCE(${email_coaching_enabled ?? null}, email_coaching_enabled),
        email_coaching_schedule = COALESCE(${email_coaching_schedule ?? null}, email_coaching_schedule),
        telegram_chat_id = COALESCE(${telegram_chat_id ?? null}, telegram_chat_id)
      WHERE user_id = ${userId}
    `;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving preferences:', error);
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
  }
}
