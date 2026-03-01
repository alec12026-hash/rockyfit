import { NextResponse } from 'next/server';

export async function GET() {
  const BRAVE_KEY = process.env.BRAVE_API_KEY || '';
  const results: any = { hasBraveKey: Boolean(BRAVE_KEY), braveKeyLength: BRAVE_KEY.length };

  // Test Brave search
  try {
    const res = await fetch(
      'https://api.search.brave.com/res/v1/web/search?q=hypertrophy+training+science&count=2&result_filter=web',
      { headers: { 'Accept': 'application/json', 'X-Subscription-Token': BRAVE_KEY } }
    );
    const data = await res.json();
    results.braveStatus = res.status;
    results.braveResults = data?.web?.results?.length || 0;
    results.firstTitle = data?.web?.results?.[0]?.title || 'none';
  } catch (e: any) {
    results.braveError = e.message;
  }

  // Test Minimax via env var
  const mmKey = process.env.MINIMAX_API_KEY || '';
  results.hasMinimaxKey = Boolean(mmKey);
  results.minimaxKeyLength = mmKey.length;
  try {
    const mmRes = await fetch('https://api.minimax.io/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${mmKey}` },
      body: JSON.stringify({ model: 'MiniMax-M2.5', messages: [{ role: 'user', content: 'Say OK' }], max_tokens: 10 })
    });
    results.minimaxStatus = mmRes.status;
    const mmData = await mmRes.json();
    results.minimaxResponse = mmData?.choices?.[0]?.message?.content || JSON.stringify(mmData).slice(0, 100);
  } catch (e: any) {
    results.minimaxError = e.message;
  }

  return NextResponse.json(results);
}
