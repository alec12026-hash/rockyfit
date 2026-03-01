import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const result = await sql`
      SELECT id, email, name, password_hash FROM users WHERE email = ${email}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Get onboarding status
    const profile = await sql`
      SELECT onboarding_complete FROM user_profiles WHERE user_id = ${user.id}
    `;
    const onboardingComplete = profile.rows[0]?.onboarding_complete || false;

    const response = NextResponse.json({ 
      success: true, 
      user: { id: user.id, email: user.email, name: user.name },
      onboardingComplete
    });

    response.cookies.set('rockyfit_user', String(user.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
