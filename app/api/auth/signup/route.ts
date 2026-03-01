import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, name, password } = await req.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await sql`
      INSERT INTO users (email, name, password_hash)
      VALUES (${email}, ${name || email.split('@')[0]}, ${password_hash})
      RETURNING id, email, name
    `;

    const user = result.rows[0];

    await sql`
      INSERT INTO user_profiles (user_id, email, onboarding_complete)
      VALUES (${user.id}, ${email}, FALSE)
    `;

    const response = NextResponse.json({ 
      success: true, 
      user: { id: user.id, email: user.email, name: user.name }
    });

    response.cookies.set('rockyfit_user', String(user.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 });
  }
}
