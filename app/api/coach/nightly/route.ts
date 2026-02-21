import { NextResponse } from 'next/server';
import { getLatestReadiness } from '@/lib/db';

export async function GET() {
  try {
    const latest = await getLatestReadiness();
    if (!latest) {
      return NextResponse.json({
        summary: 'No health data yet. Upload morning metrics and today\'s workout to get coaching.'
      });
    }

    const zone = latest.readiness_zone as string;
    const score = latest.readiness_score as number;

    const summary =
      zone === 'green'
        ? `Readiness ${score}/100 (GREEN). Recovery is strong. Keep progression aggressive tomorrow and aim to beat one key lift target.`
        : zone === 'yellow'
        ? `Readiness ${score}/100 (YELLOW). Keep intensity but trim 1 set on the final accessories. Prioritize sleep tonight.`
        : `Readiness ${score}/100 (RED). Pull back tomorrow: reduce load 5-10%, keep technique crisp, and focus on recovery metrics.`;

    return NextResponse.json({ summary });
  } catch (err) {
    console.error('nightly coach failed', err);
    return NextResponse.json({ error: 'Failed to generate coaching summary' }, { status: 500 });
  }
}
