import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

type SourceItem = { title: string; url?: string; snippet: string };

async function fetchResearchSnippets(profile: any, customQuery?: string): Promise<{ context: string; sources: SourceItem[] }> {
  const goal = profile.goal || 'general_fitness';
  const experience = profile.experience_level || 'beginner';
  const priorityMuscle = (profile.primary_focus || 'muscle').replace(/,/g, ' ');
  const BRAVE_KEY = process.env.BRAVE_API_KEY || '';
  
  const queries = customQuery ? [customQuery] : [
    `${goal} resistance training ${experience} lifter science pubmed research`,
    `optimal volume frequency ${goal} hypertrophy evidence based systematic review`,
    `${priorityMuscle} muscle growth exercise selection research`
  ];

  const snippets: string[] = [];
  const sources: SourceItem[] = [];

  for (const query of queries) {
    try {
      const res = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=3&result_filter=web`,
        { headers: { 'Accept': 'application/json', 'X-Subscription-Token': BRAVE_KEY } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const results: Array<{ title: string; description: string; url: string }> = data?.web?.results || [];
      for (const r of results.slice(0, 3)) {
        if (r.title && r.description) {
          snippets.push(`SOURCE: ${r.title}\n${r.description}`);
          sources.push({ title: r.title, url: r.url, snippet: r.description });
        }
      }
    } catch (err) {
      console.error(`Brave search error:`, err);
    }
  }

  return { context: snippets.length > 0 ? `SCIENTIFIC RESEARCH CONTEXT:\n${snippets.join('\n\n')}` : '', sources };
}

async function callMinimax(prompt: string): Promise<string> {
  const key = process.env.MINIMAX_API_KEY || '';
  if (!key) throw new Error('MINIMAX_API_KEY missing');
  
  const resp = await fetch('https://api.minimax.io/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'MiniMax-M2.5', messages: [{ role: 'user', content: prompt }], max_tokens: 3500, temperature: 0.5 })
  });
  
  if (!resp.ok) throw new Error(`MiniMax ${resp.status}`);
  const data = await resp.json();
  let content = data?.choices?.[0]?.message?.content || '';
  content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  return content;
}

function generateFallbackProgram(profile: any, customDays?: any[]): any {
  const daysPerWeek = parseInt(profile.workout_frequency) || 3;
  const goal = profile.goal || 'strength';
  const experience = profile.experience_level || 'intermediate';
  
  const programName = `${experience === 'beginner' ? '8' : experience === 'intermediate' ? '10' : '12'}-Week ${goal === 'strength' ? 'Strength' : 'Hypertrophy'} Program`;
  
  const days = customDays || [
    { dayNumber: 1, name: 'Full Body A', muscleGroups: ['chest', 'back', 'legs', 'shoulders', 'arms'], exercises: [] },
    { dayNumber: 2, name: 'Full Body B', muscleGroups: ['legs', 'chest', 'back', 'shoulders', 'arms'], exercises: [] },
    { dayNumber: 3, name: 'Full Body C', muscleGroups: ['chest', 'back', 'legs', 'shoulders', 'arms'], exercises: [] }
  ];
  
  return { programName, weeks: 8, daysPerWeek, goal, days, progressionScheme: 'Linear progression', recoveryNotes: 'Ensure 48hrs between sessions' };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, custom_split_request, custom_days } = body;
    
    if (!user_id) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 });
    }

    // Fetch user profile
    const { rows: [profile] } = await sql`
      SELECT experience_level, workout_frequency, goal, equipment, injuries, age, sex, body_weight_lbs, 
             priority_muscle, session_duration, sleep_quality, stress_level
      FROM user_profiles WHERE user_id = ${user_id}
    `;
    
    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Build research query based on custom request
    let customQuery = '';
    if (custom_split_request) {
      customQuery = `${custom_split_request} split workout program science research evidence based`;
    }

    // Fetch research
    let researchSection = '';
    let sourcesUsed: SourceItem[] = [];
    
    try {
      const research = await fetchResearchSnippets(profile, customQuery || undefined);
      if (research.context) {
        researchSection = `\n\nBased on the following scientific research:\n${research.context}\n\n`;
      }
      sourcesUsed = research.sources || [];
    } catch (e) {
      console.error('Research fetch failed:', e);
    }

    const daysDesc = custom_days ? JSON.stringify(custom_days) : `${profile.workout_frequency} days per week`;
    
    const prompt = `Generate a personalized workout program based on user profile and their specific request.

USER PROFILE:
- Experience Level: ${profile.experience_level || 'intermediate'}
- Training Frequency: ${profile.workout_frequency || 3} days per week
- Primary Goal: ${profile.goal || 'strength'}
- Equipment Available: ${profile.equipment || 'gym'}
- Injuries/Limitations: ${profile.injuries || 'none'}
- Age: ${profile.age || 'not specified'}
- Biological Sex: ${profile.sex || 'not specified'}
- Body Weight: ${profile.body_weight_lbs || 'not specified'} lbs
- Session Duration: ${profile.session_duration || 60} minutes
- Sleep Quality: ${profile.sleep_quality || 'average'}
- Stress Level: ${profile.stress_level || 'moderate'}

USER'S REQUEST: ${custom_split_request || 'Generate a program based on profile'}

${custom_days ? `SPECIFIC DAYS REQUESTED:\n${JSON.stringify(custom_days)}` : ''}

${researchSection}

Generate a complete workout program with this exact JSON structure (ONLY valid JSON, no markdown):

{
  "programName": "string - descriptive name",
  "weeks": number,
  "daysPerWeek": number,
  "goal": "string",
  "focus": "string",
  "progressionScheme": "string",
  "recoveryNotes": "string",
  "days": [
    {
      "dayNumber": 1,
      "name": "string (e.g., Push Day A, Legs, Upper Body)",
      "muscleGroups": ["array of muscle groups"],
      "scienceRationale": "string - why this day is structured this way based on research",
      "exercises": [
        {
          "name": "string",
          "sets": number,
          "reps": "string (e.g., 8-12 or 5)",
          "rest": "string",
          "rationale": "string - why this exercise"
        }
      ]
    }
  ]
}`;

    let programData = null;
    try {
      const aiResponse = await callMinimax(prompt);
      let cleaned = aiResponse.replace(/```json|```/gi, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) cleaned = jsonMatch[0];
      programData = JSON.parse(cleaned);
    } catch (e) {
      console.error('Program parse failed, using fallback:', e);
      programData = generateFallbackProgram(profile, custom_days);
    }

    programData.sourcesUsed = sourcesUsed.slice(0, 5);
    programData.researchSummary = `Program built from evidence-based training principles. ${custom_split_request ? 'Customized based on your split preference request.' : ''}`;
    programData.whyBuiltThisWay = `This program reflects your goals (${profile.goal}), your available training time (${profile.workout_frequency} days), and the split you requested.`;

    // Save to DB
    await sql`
      CREATE TABLE IF NOT EXISTS user_programs (
        id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        program_name VARCHAR(255), program_data JSONB NOT NULL, is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    const insertRes = await sql`
      INSERT INTO user_programs (user_id, program_name, program_data, is_active)
      VALUES (${user_id}, ${programData.programName}, ${JSON.stringify(programData)}, TRUE)
      RETURNING id
    `;

    await sql`UPDATE user_programs SET is_active = FALSE WHERE user_id = ${user_id} AND id != ${insertRes.rows[0].id}`;

    return NextResponse.json({ success: true, program: programData });
  } catch (error: any) {
    console.error('Regenerate error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
