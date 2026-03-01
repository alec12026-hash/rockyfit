import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';
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

const HTML_TEMPLATE = (userName: string) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #18181b 0%, #3f3f46 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
        .header p { margin: 10px 0 0; opacity: 0.8; font-size: 14px; }
        .content { background: #fafafa; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e4e4e7; }
        .greeting { font-size: 18px; font-weight: 600; margin-bottom: 20px; }
        .message { margin-bottom: 20px; }
        .signature { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e4e4e7; }
        .signature p { margin: 5px 0; }
        .coach-title { color: #18181b; font-weight: 700; }
        .highlight { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ROCKYFIT</h1>
        <p>Your Personal AI Coaching Experience</p>
    </div>
    <div class="content">
        <div class="greeting">Hey ${userName}! 👋</div>
        <div class="message">
            <p>Welcome to RockyFit! I'm <strong>Coach Rocky</strong> — your personal AI training coach.</p>
            <p>I've reviewed your profile and I'm excited to help you crush your fitness goals. Here's what I'll be doing for you:</p>
            <div class="highlight">
                <strong>📊 Daily Coaching Reports</strong><br>
                After every workout, I'll analyze your performance and give you personalized insights.
            </div>
            <div class="highlight">
                <strong>🎯 Program Adjustments</strong><br>
                Based on how you feel and how your body's responding, I'll tweak your program to keep you progressing.
            </div>
            <div class="highlight">
                <strong>💡 Answer Your Questions</strong><br>
                Got a training question? Just reply to any of my messages and I'll help you out.
            </div>
        </div>
        <div class="message">
            <p>Your personalized program is ready — go crush your first workout and let's get started!</p>
            <p>I'm here to help you get stronger, build muscle, and train smarter. Let's do this! 💪</p>
        </div>
        <div class="signature">
            <p class="coach-title">— Coach Rocky</p>
            <p style="color: #71717a; font-size: 14px;">RockyFit AI Coach</p>
        </div>
    </div>
</body>
</html>
`;

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || req.cookies.get('rockyfit_user')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const uid = parseInt(userId, 10);

    // Get user email and name
    const { rows: [user] } = await sql`
      SELECT u.email, u.name, p.onboarding_complete
      FROM users u
      LEFT JOIN user_profiles p ON p.user_id = u.id
      WHERE u.id = ${uid}
    `;

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userName = user.name || user.email.split('@')[0];

    // Send email via nodemailer
    await transporter.sendMail({
      from: `Coach Rocky <${GMAIL_EMAIL}>`,
      to: user.email,
      subject: "Welcome to RockyFit — I'm Coach Rocky",
      html: HTML_TEMPLATE(userName),
    });

    return NextResponse.json({ success: true, message: 'Welcome email sent' });
  } catch (error: any) {
    console.error('Welcome email error:', error);
    return NextResponse.json({ error: 'Failed to send welcome email' }, { status: 500 });
  }
}
