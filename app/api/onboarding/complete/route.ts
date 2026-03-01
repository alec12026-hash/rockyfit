import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || req.cookies.get('rockyfit_user')?.value;
    
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const answers = (await req.json()) as Record<string, string>;
    const uid = parseInt(userId, 10);

    for (const [key, value] of Object.entries(answers)) {
      if (value) {
        const answerValue = String(value);
        await sql`
          INSERT INTO onboarding_responses (user_id, question_key, answer)
          VALUES (${uid}, ${key}, ${answerValue})
          ON CONFLICT (user_id, question_key) 
          DO UPDATE SET answer = ${answerValue}
        `;
      }
    }

    await sql`
      UPDATE user_profiles SET
        experience_level = ${answers.experience_level || null},
        workout_frequency = ${answers.workout_frequency ? parseInt(answers.workout_frequency) : null},
        goal = ${answers.goal || null},
        equipment = ${answers.equipment || null},
        injuries = ${answers.injuries || null},
        age = ${answers.age ? parseInt(answers.age) : null},
        sex = ${answers.biological_sex || null},
        body_weight_lbs = ${answers.body_weight ? parseFloat(answers.body_weight) : null},
        priority_muscle = ${answers.primary_focus || null},
        session_duration = ${answers.session_duration || null},
        sleep_quality = ${answers.sleep_quality || null},
        stress_level = ${answers.stress_level || null},
        onboarding_complete = TRUE
      WHERE user_id = ${uid}
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Onboarding error:', error);
    return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 });
  }
}
