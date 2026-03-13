import { sql } from '@vercel/postgres';
import nodemailer from 'nodemailer';
import fs from 'fs';
import { COACHING_STYLE_EXAMPLES, COACHING_VOICE_RULES } from './lib/coaching-style';

async function main() {
  for (const line of fs.readFileSync('/home/ec2-user/.env','utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }

  const userId = 1;
  const [userRes, readinessRes, sessionRes, setRes, weeklyRes, prRes] = await Promise.all([
    sql`SELECT id, email, name FROM users WHERE id = ${userId} LIMIT 1`,
    sql`SELECT readiness_score, readiness_zone, sleep_hours, resting_hr, hrv FROM health_daily WHERE user_id = ${userId} ORDER BY source_date DESC, updated_at DESC LIMIT 1`,
    sql`SELECT id, workout_id, completed_at, total_volume, duration_minutes, notes, rating FROM workout_sessions WHERE user_id = ${userId} ORDER BY completed_at DESC LIMIT 1`,
    sql`SELECT exercise_id, set_num, weight_lbs, reps, rpe, is_pr FROM workout_sets WHERE session_id = (SELECT id FROM workout_sessions WHERE user_id = ${userId} ORDER BY completed_at DESC LIMIT 1) ORDER BY exercise_id, set_num`,
    sql`SELECT completed_at, total_volume FROM workout_sessions WHERE user_id = ${userId} AND completed_at >= NOW() - INTERVAL '7 days' ORDER BY completed_at DESC`,
    sql`SELECT COUNT(*)::int AS pr_count FROM personal_records WHERE user_id = ${userId} AND achieved_at >= NOW() - INTERVAL '30 days'`,
  ]);

  const user = userRes.rows[0];
  const readiness = readinessRes.rows[0];
  const session = sessionRes.rows[0];
  const sets = setRes.rows;
  const weekly = weeklyRes.rows;
  const monthlyPRs = prRes.rows[0]?.pr_count || 0;
  const prs = sets.filter((s: any) => s.is_pr).length;
  const weeklyVolume = weekly.reduce((sum: number, s: any) => sum + (Number(s.total_volume) || 0), 0);

  const grouped = new Map<string, any[]>();
  for (const s of sets) {
    const arr = grouped.get(s.exercise_id) || [];
    arr.push(s);
    grouped.set(s.exercise_id, arr);
  }
  const exerciseSummary = Array.from(grouped.entries()).map(([exercise, arr]) => ({
    exercise,
    sets: arr.map((s) => ({ set: s.set_num, weight: s.weight_lbs, reps: s.reps, rpe: s.rpe, isPR: s.is_pr }))
  }));

  const examples = COACHING_STYLE_EXAMPLES.map((ex, i) => `Example ${i+1}\nInput: ${JSON.stringify(ex.input)}\nOutput:\n${ex.output}`).join('\n\n');
  const payload = {
    userName: user?.name || 'Alec',
    athleteContext: {
      recurringRisk: 'history of tight biceps, triceps, and forearms feeding into upper-back flare-ups when fatigue accumulates',
      goal: 'build muscle and strength while staying healthy enough to train consistently',
    },
    latestSession: {
      workoutId: session.workout_id,
      completedAt: session.completed_at,
      totalVolume: Number(session.total_volume) || 0,
      durationMinutes: session.duration_minutes,
      notes: session.notes,
      rating: session.rating,
      prs,
      exerciseSummary,
    },
    recovery: {
      readinessScore: readiness?.readiness_score,
      readinessZone: readiness?.readiness_zone,
      sleepHours: readiness?.sleep_hours,
      restingHr: readiness?.resting_hr,
      hrv: readiness?.hrv,
    },
    trends: {
      weeklySessions: weekly.length,
      weeklyVolume,
      monthlyPRs,
    }
  };

  const apiKey = process.env.MINIMAX_API_KEY || 'sk-cp-ijH4J1X2wUGV8UEaIlIoce6j3_AUzTel5Q9rNocwgA0IzKPq4m_bZb1zPppG2LeKw9uWbpuU_gk_Ql5M4lHrWwpns7L69dfW2frmh7S4rOEA8vczRmIDFyg';

  const prompt = `${COACHING_VOICE_RULES}\n\n${examples}\n\nUse the required structure exactly:\nSession Read\nRecovery Read\nCoach's Call\nCoach wants to know\n\nWrite today's report using the real data below. Interpret the workout, compare against recovery, make one clear coaching decision, and ask one targeted question. Plain text only.\n\n${JSON.stringify(payload, null, 2)}`;

  const resp = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
    body: JSON.stringify({
      model: 'MiniMax-M2.5',
      messages: [
        { role: 'system', content: COACHING_VOICE_RULES },
        { role: 'user', content: prompt }
      ],
      tokens_to_generate: 1200,
      temperature: 0.55,
    })
  });
  if (!resp.ok) throw new Error(`Minimax failed: ${resp.status} ${await resp.text()}`);
  const data = await resp.json();
  let body = data.choices?.[0]?.message?.content || data.reply || '';
  body = body.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<[^>]+>/g, '').trim();

  const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;line-height:1.7;color:#27272a;max-width:720px;margin:0 auto;padding:24px;background:#f5f7fb;"><div style="background:#111827;color:#fff;padding:28px;border-radius:16px 16px 0 0;"><div style="font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#cbd5e1;">🏋️ RockyFit Daily Coaching Report</div><div style="font-size:14px;color:#cbd5e1;margin-top:8px;">Minimax comparison example</div></div><div style="background:#ffffff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;padding:28px;"><p style="white-space:pre-line;margin:0;font-size:16px;">${body.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p></div></body></html>`;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_EMAIL, pass: process.env.GMAIL_APP_PASSWORD }
  });
  await transporter.sendMail({
    from: `Coach Rocky <${process.env.GMAIL_EMAIL}>`,
    to: 'alec12026@gmail.com',
    subject: 'MINIMAX COMPARISON: RockyFit Daily Coaching Report',
    html,
  });
  console.log('sent minimax comparison');
}

main().catch(err => { console.error(err); process.exit(1); });
