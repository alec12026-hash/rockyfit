import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    // Force dynamic - don't cache settings
    const userId = getUserIdFromRequest(request);
    
    console.log('[settings GET] userId:', userId);
    
    // Ensure table exists just in case migration hasn't run
    await sql`
      CREATE TABLE IF NOT EXISTS user_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        key VARCHAR(100) NOT NULL,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, key)
      )
    `;

    const { rows } = await sql`SELECT key, value FROM user_settings WHERE user_id = ${userId}`;
    const settings = rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { key, value } = await req.json();
    const userId = getUserIdFromRequest(req);
    console.log('[settings POST] userId:', userId, 'key:', key, 'value:', value);
    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Missing key or value' }, { status: 400 });
    }
    
    await sql`
      INSERT INTO user_settings (user_id, key, value, updated_at)
      VALUES (${userId}, ${key}, ${String(value)}, NOW())
      ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving setting:', error);
    return NextResponse.json({ error: 'Failed to save setting' }, { status: 500 });
  }
}
