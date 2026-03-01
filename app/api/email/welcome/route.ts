import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

// Email sending via backend call - triggers Python script
async function sendWelcomeEmail(toEmail: string, userName: string): Promise<boolean> {
  const { execSync } = require('child_process');
  try {
    execSync(
      `source /home/ec2-user/.env && python3 /home/ec2-user/.openclaw/workspace/rockyfit_emails.py "${toEmail}" "${userName}"`,
      { encoding: 'utf-8', timeout: 30 }
    );
    return true;
  } catch (e) {
    console.error('Failed to send welcome email:', e);
    return false;
  }
}

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

    // Check if already sent
    if (user.onboarding_complete) {
      return NextResponse.json({ message: 'Welcome email already sent' });
    }

    const userName = user.name || user.email.split('@')[0];
    const sent = await sendWelcomeEmail(user.email, userName);

    if (sent) {
      return NextResponse.json({ success: true, message: 'Welcome email sent' });
    } else {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Welcome email error:', error);
    return NextResponse.json({ error: 'Failed to send welcome email' }, { status: 500 });
  }
}
