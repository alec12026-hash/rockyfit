import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

// GET /api/migrate?secret=<HEALTH_INGEST_TOKEN>
// Adds any missing columns to health_daily. Safe to run multiple times.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get('secret');
  const token = process.env.HEALTH_INGEST_TOKEN;

  if (!token || secret !== token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const migrations = [
    `ALTER TABLE health_daily ADD COLUMN IF NOT EXISTS weight_lbs NUMERIC(6,2)`,
    `ALTER TABLE health_daily ADD COLUMN IF NOT EXISTS sleep_quality INTEGER`,
    `ALTER TABLE health_daily ADD COLUMN IF NOT EXISTS energy_level INTEGER`,
    `ALTER TABLE health_daily ADD COLUMN IF NOT EXISTS soreness_level INTEGER`,
    `ALTER TABLE health_daily ADD COLUMN IF NOT EXISTS stress_level INTEGER`,
    `ALTER TABLE health_daily ADD COLUMN IF NOT EXISTS mood INTEGER`,
    `ALTER TABLE health_daily ADD COLUMN IF NOT EXISTS water_oz INTEGER`,
    `ALTER TABLE health_daily ADD COLUMN IF NOT EXISTS nutrition_rating INTEGER`,
    `ALTER TABLE health_daily ADD COLUMN IF NOT EXISTS active_kcal_day INTEGER`,
    `ALTER TABLE health_daily ADD COLUMN IF NOT EXISTS notes TEXT`,
  ];

  const results: string[] = [];
  for (const m of migrations) {
    try {
      await sql.query(m);
      results.push(`✓ ${m.split('ADD COLUMN IF NOT EXISTS')[1]?.trim() ?? m}`);
    } catch (err: unknown) {
      results.push(`✗ ${m} — ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({ ok: true, results });
}
