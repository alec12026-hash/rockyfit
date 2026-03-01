import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const cookieUserId = req.cookies.get('rockyfit_user')?.value;
    const headerUserId = req.headers.get('x-user-id');
    const hasSessionCookie = Boolean(cookieUserId);

    // Backward compatibility: Alec can still use the app without an auth cookie.
    // But we mark it as legacyAuto so login/signup pages can remain accessible.
    const resolvedUserId = parseInt(headerUserId || cookieUserId || '1', 10);

    if (isNaN(resolvedUserId) || resolvedUserId < 1) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const result = await sql`
      SELECT u.id, u.email, u.name, u.created_at,
             p.experience_level, p.workout_frequency, p.goal, 
             p.equipment, p.injuries, p.onboarding_complete
      FROM users u
      LEFT JOIN user_profiles p ON p.user_id = u.id
      WHERE u.id = ${resolvedUserId}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = result.rows[0];
    
    const legacyAuto = !hasSessionCookie && resolvedUserId === 1;

    return NextResponse.json({ 
      authenticated: true,
      legacyAuto,
      hasSessionCookie,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.created_at
      },
      profile: {
        experienceLevel: user.experience_level,
        workoutFrequency: user.workout_frequency,
        goal: user.goal,
        equipment: user.equipment,
        injuries: user.injuries,
        onboardingComplete: user.onboarding_complete
      }
    });
  } catch (error: any) {
    console.error('Auth check error:', error);
    return NextResponse.json({ error: 'Auth check failed' }, { status: 500 });
  }
}
