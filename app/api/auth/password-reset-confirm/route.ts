import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Look up token
    const { rows } = await sql`
      SELECT user_id, expires_at
      FROM password_reset_tokens
      WHERE token = ${token}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Invalid reset token' }, { status: 400 });
    }

    const { user_id: userId, expires_at: expiresAt } = rows[0];

    // Check if token expired
    if (new Date(expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Reset token expired' }, { status: 400 });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update user password
    await sql`
      UPDATE users SET password_hash = ${passwordHash} WHERE id = ${userId}
    `;

    // Delete used token
    await sql`
      DELETE FROM password_reset_tokens WHERE user_id = ${userId}
    `;

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    console.error('Password reset confirm error:', error);
    return NextResponse.json({ error: 'Reset failed' }, { status: 500 });
  }
}
