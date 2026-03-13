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

const COACHING_VOICE_RULES = `
You are Coach Rocky writing a daily coaching email for a RockyFit user.
- Sound natural, direct, and specific.
- No cheesy hype. No generic AI filler.
- Reference the user's actual session details when available.
- Praise specifically when earned.
- If something was weak, say it cleanly without being harsh.
- End with one concrete recommendation for the next session or recovery window.
- Keep it to 3 short sections max.
- Write like a sharp coach, not a marketer.
`;

const EXAMPLES = [
`You were in a good spot today and it showed. Bench and incline both moved with solid intent, and getting a PR on a green-readiness day is exactly what we want — strong work without turning the session into chaos.

The only thing that dipped was the back half of the workout. Triceps fading late usually means either the early pressing work was hard enough to do its job, or your rest quality dropped once fatigue set in. That is not a disaster, but it does mean the quality of your final accessory work matters more than just forcing extra junk volume.

Next session, keep the same aggression on your top pressing work, but tighten rest periods and make the last triceps movement cleaner instead of just harder.`,
`This was a solid keep-the-standard session, not a hero day. Energy was clearly flatter, but you still got the work done and that matters more than pretending every session should feel elite.

No PRs here, which is fine. On a yellow-readiness day the win is clean execution, decent output, and not digging a recovery hole you have to pay for tomorrow. You stayed on the right side of that line.

For the next lower-body session, keep the first compound movement honest, but give yourself permission to hold load steady if recovery still feels mediocre.`
];

async function generateNarrative(input: any) {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) return null;
  const prompt = `${COACHING_VOICE_RULES}\n\nExamples:\n${EXAMPLES.join('\n\n---\n\n')}\n\nWrite a daily coaching email body for this user based on the structured input below. Return plain text only.\n${JSON.stringify(input, null, 2)}`;
  const resp = await fetch('https://api.minimax.io/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
    body: JSON.stringify({
      model: 'MiniMax-M2.5',
      messages: [
        { role: 'system', content: COACHING_VOICE_RULES },
        { role: 'user', content: prompt }
      ],
      max_tokens: 700,
      temperature: 0.55
    })
  });
  const data = await resp.json();
  let content = data.choices?.[0]?.message?.content || '';
  content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<[^>]+>/g, '').trim();
  return content || null;
}

function paragraphsToHtml(text: string) {
  return text.split(/\n\s*\n/).map(p => `<p style="margin:0 0 14px; color:#3f3f46; font-size:15px; line-height:1.7;">${p.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>`).join('');
}

function buildEmail(userName: string, readinessScore: number, readinessZone: string, recentWorkouts: any[], tips: string[], narrative?: string | null) {
  const zoneColor = readinessZone === 'green' ? '#22c55e' : readinessZone === 'yellow' ? '#f59e0b' : '#ef4444';
  const workoutsHtml = recentWorkouts.length > 0
    ? recentWorkouts.map((w) => `<div style="padding: 12px; border: 1px solid #e4e4e7; border-radius: 8px; margin-bottom: 10px; background: white;"><div style="font-weight: 600; color: #18181b;">${w.workout_type || 'Workout'} · ${w.duration_minutes || w.duration_min || '--'} min · ${Math.round((w.total_volume || 0) / 1000)}k lbs</div><div style="font-size: 13px; color: #71717a; margin-top: 4px;">${new Date(w.completed_at).toLocaleDateString()}</div></div>`).join('')
    : '<p style="color:#71717a;">No recent workouts found.</p>';
  const tipsHtml = tips.map((tip) => `<li style="margin-bottom: 8px;">${tip}</li>`).join('');
  return `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; line-height:1.6; color:#333; max-width:600px; margin:0 auto; padding:20px; background:#f9fafb;"><div style="background:linear-gradient(135deg, #18181b 0%, #3f3f46 100%); color:white; padding:24px; border-radius:12px 12px 0 0;"><h1 style="margin:0;font-size:28px;">Your RockyFit Coaching Report</h1><p style="margin:8px 0 0;opacity:.85;">Example report from today's logged session</p></div><div style="background:white; padding:24px; border:1px solid #e4e4e7; border-top:none; border-radius:0 0 12px 12px;"><p style="font-size:18px;font-weight:600;">Hey ${userName},</p><div style="background:${zoneColor}; color:white; padding:12px 16px; border-radius:10px; font-weight:700; display:inline-block;">Readiness ${readinessScore}/100 · ${readinessZone.toUpperCase()}</div>${narrative ? `<div style="background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;padding:18px;margin:20px 0;"><div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#71717a;margin-bottom:10px;">Coach Rocky's Read</div>${paragraphsToHtml(narrative)}</div>` : ''}<h3 style="color:#18181b; margin:20px 0 12px;">Recent Workouts</h3>${workoutsHtml}<div style="background:#fafafa; padding:16px; border-left:4px solid ${zoneColor}; margin-top:20px;"><h3 style="margin-top:0;">Today's coaching focus</h3><ul style="padding-left:20px; margin-bottom:0;">${tipsHtml}</ul></div></div></body></html>`;
}

async function main() {
  const [{ rows: userRows }, { rows: readinessRows }, { rows: sessionRows }] = await Promise.all([
    sql`SELECT id, email, name FROM users WHERE id = 1 LIMIT 1`,
    sql`SELECT readiness_score, readiness_zone FROM health_daily WHERE user_id = 1 ORDER BY source_date DESC LIMIT 1`,
    sql`SELECT completed_at, workout_id as workout_type, duration_minutes, total_volume, notes, rating FROM workout_sessions WHERE user_id = 1 AND completed_at::date = CURRENT_DATE ORDER BY completed_at DESC LIMIT 5`
  ]);
  const user = userRows[0];
  if (!user) throw new Error('User 1 not found');
  const readinessScore = readinessRows[0]?.readiness_score ?? 72;
  const readinessZone = readinessRows[0]?.readiness_zone ?? 'yellow';
  const tips = readinessZone === 'green'
    ? ['Push the top sets if bar speed feels good.', 'Keep accessory work honest, not sloppy.', 'Eat and sleep like you want tomorrow to count.']
    : readinessZone === 'yellow'
    ? ['Keep the main work quality high, but don\'t chase junk fatigue.', 'Hold load steady if recovery feels flat.', 'Get ahead on food and sleep tonight.']
    : ['Treat tomorrow like recovery-focused training.', 'Reduce load and keep technique clean.', 'Do the boring recovery stuff on purpose tonight.'];
  const narrative = await generateNarrative({
    userName: user.name || 'Alec',
    readinessScore,
    readinessZone,
    recentWorkouts: sessionRows,
    tips,
  });
  const html = buildEmail(user.name || 'Alec', readinessScore, readinessZone, sessionRows, tips, narrative);
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_EMAIL, pass: process.env.GMAIL_APP_PASSWORD }
  });
  await transporter.sendMail({
    from: `Coach Rocky <${process.env.GMAIL_EMAIL}>`,
    to: 'alec12026@gmail.com',
    subject: `EXAMPLE: Your RockyFit Coaching Report — ${readinessScore}/100 (${String(readinessZone).toUpperCase()})`,
    html,
  });
  console.log('sent', { sessions: sessionRows.length, readinessScore, readinessZone, email: 'alec12026@gmail.com' });
}

main().catch(err => { console.error(err); process.exit(1); });
