import { NextResponse } from 'next/server';

const cache = new Map<string, any>();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    if (!q) return NextResponse.json({ success: false, error: 'Missing q' }, { status: 400 });

    const key = q.toLowerCase();
    if (cache.has(key)) {
      return NextResponse.json({ success: true, ...cache.get(key), cached: true });
    }

    const url = `https://www.exercisedb.dev/api/v1/exercises/search?q=${encodeURIComponent(q)}&limit=6&threshold=0.4`;
    const res = await fetch(url, { next: { revalidate: 86400 } });

    if (!res.ok) {
      return NextResponse.json({ success: false, error: 'Exercise lookup failed' }, { status: 200 });
    }

    const data = await res.json();
    const first = data?.data?.[0];
    if (!first?.gifUrl) {
      return NextResponse.json({ success: false, error: 'No match' }, { status: 200 });
    }

    const payload = {
      matchName: first.name,
      gifUrl: first.gifUrl,
      exerciseId: first.exerciseId,
    };

    cache.set(key, payload);
    return NextResponse.json({ success: true, ...payload });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Lookup error' }, { status: 200 });
  }
}
