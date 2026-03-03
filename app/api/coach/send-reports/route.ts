import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

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

// Coaching report email template
function buildCoachingEmail(
  userName: string,
  readinessScore: number,
  readinessZone: string,
  recentWorkouts: { completed_at: string; workout_type: string; duration_min: number; total_volume: number }[],
  tips: string[]
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
            ${w.workout_type || 'Workout'} · ${w.duration_min || '--'} min · ${Math.round((w.total_volume || 0) / 1000)}k lbs
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

export async function GET() {
  try {
    // Check if emails are enabled
    // Email sending is enabled (remove gate for now)
    // if (process.env.COACHING_EMAILS_ENABLED !== 'true') {
    //   console.log('COACHING_EMAILS_DISABLED — skipping');
    //   return NextResponse.json({ skipped: true, reason: 'COACHING_EMAILS_ENABLED not set to true' });
    // }

    // Get current time in Eastern Time (ET)
    // Users set their coaching time in ET (e.g., 9 PM ET = 21:00)
    const now = new Date();
    // Convert UTC to ET (UTC-5 for EST, UTC-4 for EDT)
    const etOffset = -5; // EST (standard time)
    const etDate = new Date(now.getTime() + etOffset * 60 * 60 * 1000);
    const currentHour = etDate.getUTCHours();
    const currentMinute = etDate.getUTCMinutes();

    console.log(`Current ET time: ${currentHour}:${currentMinute} (for comparison with user coaching times)`);

    // Find users whose coaching_report_time matches now (within 5-minute window) AND who have emails enabled
    // We check for exact hour match and minute within 0-4 range
    const { rows: users } = await sql`
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
      return NextResponse.json({ processed: 0, sent: 0 });
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

      if (existingLog.rows.length > 0) {
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
          SELECT completed_at, workout_type, duration_min, total_volume
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

        // Send coaching report email
        await transporter.sendMail({
          from: `Coach Rocky <${GMAIL_EMAIL}>`,
          to: userEmail,
          subject: `Your Daily Coaching Report — ${readinessScore}/100 (${readinessZone.toUpperCase()})`,
          html: buildCoachingEmail(userName, readinessScore, readinessZone, recentWorkouts.rows as any[], tips),
        });
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

    return NextResponse.json({ processed: users.length, sent: sentCount });
  } catch (error) {
    console.error('Send reports error:', error);
    return NextResponse.json({ error: 'Failed to send reports' }, { status: 500 });
  }
}
