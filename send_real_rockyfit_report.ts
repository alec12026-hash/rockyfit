import { sql } from '@vercel/postgres';
import nodemailer from 'nodemailer';
import fs from 'fs';

const envFile = '/home/ec2-user/.env';
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const COACHING_VOICE_RULES = `You are Coach Rocky writing a daily coaching email for a RockyFit user.
- Sound natural, direct, and specific.
- No cheesy hype. No generic AI filler.
- Reference the user's actual session details when available.
- Praise specifically when earned.
- If something was weak, say it cleanly without being harsh.
- End with one concrete recommendation for the next session or recovery window.
- Keep it to 3 short sections max.
- Write like a sharp coach, not a marketer.`;

async function generateNarrative(input: any) {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) return null;
  const response = await fetch('https://api.minimax.io/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
    body: JSON.stringify({
      model: 'MiniMax-M2.5',
      messages: [
        { role: 'system', content: COACHING_VOICE_RULES },
        { role: 'user', content: `Write a daily coaching email body based on this real session data. Return plain text only. ${JSON.stringify(input)}` }
      ],
      max_tokens: 700,
      temperature: 0.55,
    })
  });
  const data = await response.json();
  let content = data.choices?.[0]?.message?.content || '';
  return content.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<[^>]+>/g, '').trim() || null;
}

function paragraphsToHtml(text: string) {
  return text.split(/\n\s*\n/).map(p => `<p style="margin:0 0 14px; color:#3f3f46; font-size:15px; line-height:1.7;">${p.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>`).join('');
}

async function main() {
  const userId = 1;
  const [userRes, readinessRes, sessionRes, setRes] = await Promise.all([
    sql`SELECT id, email, name FROM users WHERE id = ${userId} LIMIT 1`,
    sql`SELECT readiness_score, readiness_zone FROM health_daily WHERE user_id = ${userId} ORDER BY source_date DESC LIMIT 1`,
    sql`SELECT id, completed_at, workout_id, total_volume, duration_minutes, notes, rating FROM workout_sessions WHERE user_id = ${userId} ORDER BY completed_at DESC LIMIT 1`,
    sql`SELECT ws.exercise_id, ws.set_num, ws.weight_lbs, ws.reps, ws.rpe, ws.is_pr FROM workout_sets ws WHERE ws.session_id = (SELECT id FROM workout_sessions WHERE user_id = ${userId} ORDER BY completed_at DESC LIMIT 1) ORDER BY ws.exercise_id, ws.set_num`
  ]);

  const user = userRes.rows[0];
  const session = sessionRes.rows[0];
  if (!user || !session) throw new Error('No user/session found');

  const readinessScore = readinessRes.rows[0]?.readiness_score ?? 77;
  const readinessZone = readinessRes.rows[0]?.readiness_zone ?? 'green';
  const prs = setRes.rows.filter((s: any) => s.is_pr).length;
  const topSets = setRes.rows.slice(0, 8).map((s: any) => `${s.exercise_id} set ${s.set_num}: ${s.weight_lbs || '-'} x ${s.reps || '-'}${s.rpe ? ` @RPE ${s.rpe}` : ''}`);
  const tips = readinessZone === 'green'
    ? ['Keep progressing your top movements when execution stays clean.', 'Don\'t let accessory quality fall off once fatigue shows up.', 'Get food and sleep right so the next session can actually move.']
    : readinessZone === 'yellow'
    ? ['Hold load steady if bar speed or energy feels flat.', 'Protect execution before chasing more volume.', 'Use tonight to recover on purpose.']
    : ['Treat the next session like controlled work, not a max-output day.', 'Reduce load a bit and keep your technique sharp.', 'Prioritize recovery and don\'t force progression.'];

  const narrative = await generateNarrative({
    userName: user.name || 'Alec',
    readinessScore,
    readinessZone,
    session: {
      workoutId: session.workout_id,
      completedAt: session.completed_at,
      totalVolume: session.total_volume,
      durationMinutes: session.duration_minutes,
      notes: session.notes,
      rating: session.rating,
      prs,
      topSets,
    },
    tips,
  });

  const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;background:#f9fafb;"><div style="background:linear-gradient(135deg,#18181b 0%,#3f3f46 100%);color:white;padding:24px;border-radius:12px 12px 0 0;"><h1 style="margin:0;font-size:28px;">Your RockyFit Coaching Report</h1><p style="margin:8px 0 0;opacity:.85;">Built from your real latest logged session</p></div><div style="background:white;padding:24px;border:1px solid #e4e4e7;border-top:none;border-radius:0 0 12px 12px;"><p style="font-size:18px;font-weight:600;">Hey ${user.name || 'Alec'},</p><div style="background:${readinessZone === 'green' ? '#22c55e' : readinessZone === 'yellow' ? '#f59e0b' : '#ef4444'};color:white;padding:12px 16px;border-radius:10px;font-weight:700;display:inline-block;">Readiness ${readinessScore}/100 · ${String(readinessZone).toUpperCase()}</div><div style="background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;padding:18px;margin:20px 0;"><div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#71717a;margin-bottom:10px;">Coach Rocky's Read</div>${paragraphsToHtml(narrative || 'Solid session logged. The framework is working; now we refine the report voice.')}</div><h3 style="color:#18181b;margin:20px 0 12px;">Session Summary</h3><div style="padding:12px;border:1px solid #e4e4e7;border-radius:8px;margin-bottom:10px;background:white;"><div style="font-weight:600;color:#18181b;">${session.workout_id} · ${session.duration_minutes ?? '--'} min · ${Math.round((session.total_volume || 0)/1000)}k lbs</div><div style="font-size:13px;color:#71717a;margin-top:4px;">${new Date(session.completed_at).toLocaleString()}</div><div style="font-size:13px;color:#71717a;margin-top:4px;">PRs: ${prs}</div></div><h3 style="color:#18181b;margin:20px 0 12px;">Top Logged Sets</h3><ul>${topSets.map(s => `<li style="margin-bottom:6px;">${s}</li>`).join('')}</ul><div style="background:#fafafa;padding:16px;border-left:4px solid ${readinessZone === 'green' ? '#22c55e' : readinessZone === 'yellow' ? '#f59e0b' : '#ef4444'};margin-top:20px;"><h3 style="margin-top:0;">Today's coaching focus</h3><ul style="padding-left:20px;margin-bottom:0;">${tips.map(t => `<li style="margin-bottom:8px;">${t}</li>`).join('')}</ul></div></div></body></html>`;

  const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.GMAIL_EMAIL, pass: process.env.GMAIL_APP_PASSWORD } });
  await transporter.sendMail({
    from: `Coach Rocky <${process.env.GMAIL_EMAIL}>`,
    to: 'alec12026@gmail.com',
    subject: `REAL SESSION: Your RockyFit Coaching Report — ${readinessScore}/100 (${String(readinessZone).toUpperCase()})`,
    html,
  });
  console.log('sent real report', { workoutId: session.workout_id, completedAt: session.completed_at, prs, to: 'alec12026@gmail.com' });
}

main().catch(err => { console.error(err); process.exit(1); });
