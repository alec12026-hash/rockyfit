import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const GMAIL_EMAIL = process.env.GMAIL_EMAIL || 'rockyclawdbotai@gmail.com';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || '';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_EMAIL,
    pass: GMAIL_APP_PASSWORD,
  },
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://rockyfit.vercel.app';

const RESET_EMAIL_TEMPLATE = (userName: string, resetToken: string) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #18181b 0%, #3f3f46 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
        .header p { margin: 10px 0 0; opacity: 0.8; font-size: 14px; }
        .content { background: #fafafa; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e4e4e7; }
        .button { display: inline-block; background: #18181b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
        .button:hover { background: #3f3f46; }
        .signature { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e4e4e7; }
        .signature p { margin: 5px 0; }
        .coach-title { color: #18181b; font-weight: 700; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ROCKYFIT</h1>
        <p>Password Reset Request</p>
    </div>
    <div class="content">
        <p>Hey ${userName},</p>
        <p>We received a request to reset your RockyFit password. Click the button below to create a new password:</p>
        <p style="text-align: center;">
            <a href="${APP_URL}/password-reset/confirm?token=${resetToken}" class="button">Reset Password</a>
        </p>
        <p><strong>This link expires in 1 hour.</strong></p>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
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
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Check if user exists (don't reveal whether email exists)
    const { rows } = await sql`
      SELECT id, email, name FROM users WHERE email = ${email}
    `;

    if (rows.length === 0) {
      // Don't reveal that user doesn't exist - just return success
      return NextResponse.json({ success: true, message: 'If account exists, email sent' });
    }

    const user = rows[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    // Store token in database
    await sql`
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES (${user.id}, ${resetToken}, ${expiresAt})
      ON CONFLICT (user_id) DO UPDATE SET token = ${resetToken}, expires_at = ${expiresAt}
    `;

    // Send reset email
    const userName = user.name || user.email.split('@')[0];
    
    try {
      await transporter.sendMail({
        from: `Coach Rocky <${GMAIL_EMAIL}>`,
        to: user.email,
        subject: 'Reset your RockyFit password',
        html: RESET_EMAIL_TEMPLATE(userName, resetToken),
      });
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      // Still return success to not reveal email issues
    }

    return NextResponse.json({ success: true, message: 'If account exists, email sent' });
  } catch (error: any) {
    console.error('Password reset request error:', error);
    return NextResponse.json({ error: error.message || 'Request failed' }, { status: 500 });
  }
}
