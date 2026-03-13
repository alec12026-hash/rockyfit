import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { COACHING_STYLE_EXAMPLES, COACHING_VOICE_RULES } from '@/lib/coaching-style';

// Email config from env
const GMAIL_EMAIL = process.env.GMAIL_EMAIL || 'rockyclawdbotai@gmail.com';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || '';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_EMAIL,
    pass: GMAIL_APP_PASSWORD,
  },
});


async function getMinimaxKey(): Promise<string> {
  if (process.env.MINIMAX_API_KEY) return process.env.MINIMAX_API_KEY;
  return 'sk-cp-ijH4J1X2wUGV8UEaIlIoce6j3_AUzTel5Q9rNocwgA0IzKPq4m_bZb1zPppG2LeKw9uWbpuU_gk_Ql5M4lHrWwpns7L69dfW2frmh7S4rOEA8vczRmIDFyg';
}

async function generateCoachingNarrative(params: {
  userName: string;
  readinessScore: number;
  readinessZone: string;
  recentWorkouts: { completed_at: string; workout_type: string; duration_min?: number; duration_minutes?: number; total_volume: number; notes?: string; rating?: number }[];
  tips: string[];
}): Promise<string | null> {
  const apiKey = await getMinimaxKey();
  if (!apiKey) return null;

  const examples = COACHING_STYLE_EXAMPLES.map((ex, i) => `Example ${i + 1}\nInput: ${JSON.stringify(ex.input)}\nOutput:\n${ex.output}`).join('\n\n');
  const prompt = `${COACHING_VOICE_RULES}\n\n${examples}\n\nWrite a daily coaching email body for this user.\nInput: ${JSON.stringify(params)}\n\nReturn plain text only. No subject line. No markdown.`;

  try {
    const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.5',
        messages: [
          { role: 'system', content: COACHING_VOICE_RULES },
          { role: 'user', content: prompt }
        ],
        tokens_to_generate: 900,
        temperature: 0.55,
      })
    });
    if (!response.ok) {
      console.error('Minimax coaching API error:', response.status, await response.text());
      return null;
    }
    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || data.reply || '';
    content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<[^>]+>/g, '').trim();
    if (!content) return null;
    const lower = content.toLowerCase();
    if (lower.includes('invalid api key') || lower.includes('login fail') || lower.includes('authorized_error') || lower.includes('status_msg')) return null;
    return content || null;
  } catch (error) {
    console.error('Minimax coaching generation failed:', error);
    return null;
  }
}

function paragraphsToHtml(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((p) => `<p style="margin:0 0 14px; color:#3f3f46; font-size:15px; line-height:1.7;">${p.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`)
    .join('');
}


function buildFallbackNarrative(params: {
  userName: string;
  readinessScore: number;
  readinessZone: string;
  recentWorkouts: { completed_at: string; workout_type: string; duration_min?: number; duration_minutes?: number; total_volume: number; notes?: string; rating?: number }[];
  tips: string[];
}) {
  const latest = params.recentWorkouts[0];
  const weeklySessions = params.recentWorkouts.length;
  const weeklyVolume = params.recentWorkouts.reduce((sum, w) => sum + (Number(w.total_volume) || 0), 0);
  const workoutName = latest?.workout_type || 'your latest workout';
  const volumeK = latest ? Math.round((Number(latest.total_volume) || 0) / 1000) : null;

  const sessionRead = latest
    ? `${params.userName}, your latest session was ${workoutName}, and it put up about ${volumeK}k pounds of total volume. That is enough work to matter, so the main question is not whether you trained hard at all — it is whether the session stayed productive without bleeding into junk fatigue. Based on the amount of work in the session, this looks like a day where execution and recovery quality matter more than forcing extra output.`
    : `${params.userName}, you have recent training data, but the latest session details are limited. Even without every detail, the coaching decision still has to come from the same place: was the work productive, and does recovery support pushing again right away?`;

  const recoveryRead = params.readinessZone === 'green'
    ? `Recovery is in a good enough place to support hard training. A readiness score of ${params.readinessScore}/100 in the green zone means the body is giving you room to be assertive, but that still does not mean every movement deserves reckless progression.`
    : params.readinessZone === 'yellow'
    ? `Recovery is workable, but not clean. A readiness score of ${params.readinessScore}/100 in the yellow zone means you can absolutely train, but you should respect the fact that recovery is sending a caution signal instead of a green light.`
    : `Recovery is the louder story right now. A readiness score of ${params.readinessScore}/100 in the red zone means the next decision should be driven by preservation and control, not by momentum or emotion.`;

  const trendRead = `Across your recent visible training, you have ${weeklySessions} logged sessions totaling about ${Math.round(weeklyVolume / 1000)}k pounds of work. That is enough accumulated workload that the coaching call should stay tied to quality and recovery, not just the temptation to keep stacking hard sessions.`;

  const coachCall = `Coach's Call: ${params.tips.filter(Boolean).join(' ')} `;
  const question = `Coach wants to know: did the session feel better than your recovery data suggested, or did you notice fatigue building before the workout was even over?`;

  return `${sessionRead}

${recoveryRead} ${trendRead}

${coachCall}

${question}`;
}

// Coaching report email template
function buildCoachingEmail(
  userName: string,
  readinessScore: number,
  readinessZone: string,
  recentWorkouts: { completed_at: string; workout_type: string; duration_min?: number; duration_minutes?: number; total_volume: number }[],
  tips: string[],
  narrative?: string | null
) {
  const zoneColors: Record<string, string> = {
    green: '#22c55e',
    yellow: '#eab308',
    red: '#ef4444',
  };
  const zoneColor = zoneColors[readinessZone] || '#71717a';

  const workoutsHtml = recentWorkouts.length > 0
    ? recentWorkouts.map((w, i) => `
        <div style="margin-bottom: 12px; padding: 12px; background: #fafafa; border-radius: 6px;">
          <strong style="color: #18181b;">Session ${i + 1}</strong>
          <p style="margin: 4px 0 0; color: #52525b; font-size: 14px;">
            ${w.workout_type || 'Workout'} · ${w.duration_minutes || w.duration_min || '--'} min · ${Math.round((w.total_volume || 0) / 1000)}k lbs
          </p>
          <p style="margin: 4px 0 0; color: #71717a; font-size: 12px;">
            ${new Date(w.completed_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
        </div>
      `).join('')
    : '<p style="color: #71717a;">No workouts logged yet.</p>';

  const tipsHtml = tips.length > 0
    ? tips.map(tip => `<li style="margin-bottom: 8px;">${tip}</li>`).join('')
    : '<li>Keep consistent with your training.</li>';

  return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #18181b 0%, #3f3f46 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
        .content { background: #fafafa; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e4e4e7; }
        .score-box { text-align: center; padding: 20px; background: white; border-radius: 12px; margin: 20px 0; border: 2px solid ${zoneColor}; }
        .score { font-size: 48px; font-weight: bold; color: ${zoneColor}; }
        .zone { font-size: 14px; font-weight: bold; text-transform: uppercase; color: ${zoneColor}; }
        .tips { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        .tips h3 { margin: 0 0 10px; font-size: 16px; }
        .signature { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e4e4e7; }
        .signature p { margin: 5px 0; }
        .coach-title { color: #18181b; font-weight: 700; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ROCKYFIT</h1>
        <p>Your Daily Coaching Report</p>
    </div>
    <div class="content">
        <p style="font-size: 18px;">Hey ${userName}! 👊</p>
        
        <div class="score-box">
            <div class="score">${readinessScore}/100</div>
            <div class="zone">${readinessZone.toUpperCase()} ZONE</div>
            <p style="margin: 10px 0 0; color: #52525b; font-size: 14px;">
              ${readinessZone === 'green' ? 'You\'re primed to crush it!' :
                readinessZone === 'yellow' ? 'Proceed with intention today.' :
                'Consider pulling back and prioritizing recovery.'}
            </p>
        </div>

        ${narrative ? `<div style="background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;padding:18px;margin:20px 0;"><div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#71717a;margin-bottom:10px;">Coach Rocky's Read</div>${paragraphsToHtml(narrative)}</div>` : ''}

        <h3 style="color: #18181b; margin-bottom: 12px;">Recent Workouts</h3>
        ${workoutsHtml}

        <div class="tips">
            <h3>🎯 Today's Coaching Tips</h3>
            <ul style="margin: 0; padding-left: 20px;">
                ${tipsHtml}
            </ul>
        </div>

        <div class="signature">
            <p class="coach-title">— Coach Rocky</p>
            <p style="color: #71717a; font-size: 14px;">RockyFit AI Coach</p>
            <p style="color: #a1a1aa; font-size: 12px; margin-top: 15px;">
                Reply to this email if you have questions — I'll respond personally.
            </p>
        </div>
    </div>
</body>
</html>
  `.trim();
}

// Nudge email template for users with no workouts
function buildNudgeEmail(userName: string) {
  return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #18181b 0%, #3f3f46 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
        .content { background: #fafafa; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e4e4e7; }
        .greeting { font-size: 18px; font-weight: 600; margin-bottom: 20px; }
        .questions { background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 15px; margin: 20px 0; }
        .questions h3 { margin: 0 0 10px; font-size: 16px; color: #0c4a6e; }
        .questions p { margin: 8px 0; color: #164e63; font-size: 14px; }
        .signature { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e4e4e7; }
        .signature p { margin: 5px 0; }
        .coach-title { color: #18181b; font-weight: 700; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ROCKYFIT</h1>
        <p>Coach Rocky here 👊</p>
    </div>
    <div class="content">
        <div class="greeting">Hey ${userName}!</div>
        
        <p>Hope you're doing well. I haven't seen you log a workout yet, and I wanted to check in.</p>
        
        <p>I know life gets busy — but I'm here to help you crush your goals. Whether you're just getting started or getting back after a break, I've got your back.</p>

        <div class="questions">
            <h3>Quick questions to get to know you better:</h3>
            <p>• What's your biggest challenge getting started?</p>
            <p>• What time of day do you prefer to train?</p>
            <p>• What's your #1 fitness goal right now?</p>
        </div>

        <p>Hit reply and let me know — I'll write back personally and we'll get you set up with a plan that works for YOU.</p>

        <p>Let's do this! 💪</p>

        <div class="signature">
            <p class="coach-title">— Coach Rocky</p>
            <p style="color: #71717a; font-size: 14px;">RockyFit AI Coach</p>
            <p style="color: #a1a1aa; font-size: 11px; margin-top: 15px;">
                Want to stop these emails? Go to Settings in the RockyFit app and toggle off Coaching Emails.
            </p>
        </div>
    </div>
</body>
</html>
  `.trim();
}

export async function GET(request: Request) {
  try {
    // Check if emails are enabled
    // Email sending is enabled (remove gate for now)
    // if (process.env.COACHING_EMAILS_ENABLED !== 'true') {
    //   console.log('COACHING_EMAILS_DISABLED — skipping');
    //   return NextResponse.json({ skipped: true, reason: 'COACHING_EMAILS_ENABLED not set to true' });
    // }

    const now = new Date();
    const etParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York', hour12: false, hour: '2-digit', minute: '2-digit'
    }).formatToParts(now);
    const currentHour = parseInt(etParts.find(p => p.type === 'hour')?.value || '0', 10);
    const currentMinute = parseInt(etParts.find(p => p.type === 'minute')?.value || '0', 10);

    console.log(`Current ET time: ${currentHour}:${currentMinute} (for comparison with user coaching times)`);

    const url = new URL(request.url);
    const testUserId = url.searchParams.get('userId');
    const forceSend = url.searchParams.get('force') === '1';

    const { rows: users } = testUserId
      ? await sql`
          SELECT DISTINCT u.id, u.email, u.name,
                 COALESCE(us.value, '21:00') as coaching_time,
                 COALESCE(ue.value, 'true') as coaching_emails_enabled
          FROM users u
          LEFT JOIN user_settings us ON us.user_id = u.id AND us.key = 'coaching_report_time'
          LEFT JOIN user_settings ue ON ue.user_id = u.id AND ue.key = 'coaching_emails_enabled'
          WHERE u.id = ${testUserId}
        `
      : await sql`
          SELECT DISTINCT u.id, u.email, u.name, us.value as coaching_time
          FROM users u
          LEFT JOIN user_settings us ON us.user_id = u.id AND us.key = 'coaching_report_time'
          LEFT JOIN user_settings ue ON ue.user_id = u.id AND ue.key = 'coaching_emails_enabled'
          WHERE us.value IS NOT NULL 
            AND (ue.value IS NULL OR ue.value = 'true')
            AND SUBSTRING(us.value FROM 1 FOR 2) = ${String(currentHour).padStart(2, '0')}
            AND CAST(SUBSTRING(us.value FROM 4 FOR 2) AS INTEGER) BETWEEN ${currentMinute} AND ${currentMinute + 4}
        `;

    if (users.length === 0) {
      return NextResponse.json({ processed: 0, sent: 0, reason: 'no_matching_users' });
    }

    // Create the tracking table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS coaching_report_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        sent_at TIMESTAMP DEFAULT NOW(),
        report_type VARCHAR(50) DEFAULT 'coaching'
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS coaching_reports (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        report_date DATE NOT NULL DEFAULT CURRENT_DATE,
        model VARCHAR(100),
        subject TEXT,
        body_text TEXT,
        readiness_score INTEGER,
        readiness_zone VARCHAR(20),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    let sentCount = 0;

    for (const user of users) {
      const userId = user.id;
      const userEmail = user.email;
      const userName = user.name || user.email.split('@')[0];

      // Check if already sent today
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);

      const existingLog = await sql`
        SELECT id FROM coaching_report_log 
        WHERE user_id = ${userId} 
          AND sent_at >= ${todayStart.toISOString()}
        LIMIT 1
      `;

      if (!forceSend && existingLog.rows.length > 0) {
        // Already sent today, skip
        continue;
      }

      // Check if user has any workout sessions
      const workoutCheck = await sql`
        SELECT id FROM workout_sessions 
        WHERE user_id = ${userId} 
        LIMIT 1
      `;

      const hasWorkouts = workoutCheck.rows.length > 0;

      if (hasWorkouts) {
        // Get user's latest health data
        const healthData = await sql`
          SELECT readiness_score, readiness_zone, sleep_hours, hrv
          FROM health_daily
          WHERE user_id = ${userId}
          ORDER BY source_date DESC
          LIMIT 1
        `;

        // Get recent workouts (last 3)
        const recentWorkouts = await sql`
          SELECT completed_at, workout_id AS workout_type, duration_minutes AS duration_min, total_volume, notes, rating
          FROM workout_sessions
          WHERE user_id = ${userId} AND completed_at IS NOT NULL
          ORDER BY completed_at DESC
          LIMIT 3
        `;

        const health = healthData.rows[0];
        const readinessScore = health?.readiness_score ?? 50;
        const readinessZone = health?.readiness_zone ?? 'yellow';

        // Generate coaching tips based on zone
        const tips = readinessZone === 'green'
          ? ['Hit your overload targets today', 'Push for PRs if the bar feels light', 'You\'re primed — trust your training']
          : readinessZone === 'yellow'
          ? ['Keep weights at baseline', 'Cap top sets at RPE 8-9', 'Add extra rest between heavy sets']
          : ['Reduce load by 5-10%', 'Focus on form over intensity', 'Consider active recovery instead'];

        const narrative = await generateCoachingNarrative({
          userName,
          readinessScore,
          readinessZone,
          recentWorkouts: recentWorkouts.rows as any[],
          tips,
        });
        const modelUsed = narrative ? 'MiniMax-M2.5' : 'rules-fallback';
        const subject = `[${modelUsed}] Your Daily Coaching Report — ${readinessScore}/100 (${readinessZone.toUpperCase()})`; 
        const finalNarrative = narrative || buildFallbackNarrative({ userName, readinessScore, readinessZone, recentWorkouts: recentWorkouts.rows as any[], tips });
        const html = buildCoachingEmail(userName, readinessScore, readinessZone, recentWorkouts.rows as any[], tips, finalNarrative);
        await transporter.sendMail({
          from: `Coach Rocky <${GMAIL_EMAIL}>`,
          to: userEmail,
          subject,
          html,
        });
        await sql`
          INSERT INTO coaching_reports (user_id, report_date, model, subject, body_text, readiness_score, readiness_zone)
          VALUES (${userId}, CURRENT_DATE, ${modelUsed}, ${subject}, ${finalNarrative || tips.join(' | ')}, ${readinessScore}, ${readinessZone})
        `;
      } else {
        // Send nudge email (no workouts yet)
        await transporter.sendMail({
          from: `Coach Rocky <${GMAIL_EMAIL}>`,
          subject: "Rocky here — haven't seen you in the gym yet 👊",
          html: buildNudgeEmail(userName),
          to: userEmail,
        });
      }

      // Log the report as sent
      await sql`
        INSERT INTO coaching_report_log (user_id, sent_at, report_type)
        VALUES (${userId}, NOW(), ${hasWorkouts ? 'coaching' : 'nudge'})
      `;

      sentCount++;
    }

    return NextResponse.json({ processed: users.length, sent: sentCount, lastModelUsed: users.length ? 'check coaching_reports table / email subject' : null });
  } catch (error) {
    console.error('Send reports error:', error);
    return NextResponse.json({ error: 'Failed to send reports' }, { status: 500 });
  }
}
