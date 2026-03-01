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

  // Test Minimax key access
  try {
    const fs = require('fs');
    const authPath = `${process.env.HOME}/.openclaw/agents/main/agent/auth-profiles.json`;
    results.authPathExists = fs.existsSync(authPath);
    const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
    const key = auth?.profiles?.['minimax:default']?.key || '';
    results.hasMinimaxKey = Boolean(key);

    const mmRes = await fetch('https://api.minimax.io/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ model: 'MiniMax-M2.5', messages: [{ role: 'user', content: 'Say OK' }], max_tokens: 5 })
    });
    results.minimaxStatus = mmRes.status;
  } catch (e: any) {
    results.minimaxError = e.message;
  }

  return NextResponse.json(results);
}
