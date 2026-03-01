import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

interface DuckDuckGoResult {
  AbstractText?: string;
  RelatedTopics?: Array<{ Text?: string }>;
}

// Fetch research snippets from DuckDuckGo API
async function fetchResearchSnippets(profile: any): Promise<string> {
  const goal = profile.goal || 'general_fitness';
  const experience = profile.experience_level || 'beginner';
  const priorityMuscle = profile.primary_focus || 'muscle';
  
  const queries = [
    `${goal} training program ${experience} scientific research`,
    `optimal sets reps ${goal} muscle hypertrophy evidence based`,
    `${priorityMuscle} muscle development exercise science`
  ];
  
  const snippets: string[] = [];
  
  for (const query of queries) {
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(
        `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`
      );
      const data: DuckDuckGoResult = await response.json();
      
      if (data.AbstractText) {
        snippets.push(`[${query}]: ${data.AbstractText}`);
      }
      
      if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        const top3: string[] = data.RelatedTopics.slice(0, 3)
          .map((t: any) => t.Text as string | undefined)
          .filter((t): t is string => Boolean(t));
        snippets.push(...top3);
      }
    } catch (error) {
      console.error(`DuckDuckGo search failed for query: ${query}`, error);
    }
  }
  
  return snippets.join('\n\n');
}

// Fallback program generator when Minimax is unavailable
function generateFallbackProgram(profile: any): any {
  const daysPerWeek = parseInt(profile.workout_frequency) || 3;
  const goal = profile.goal || 'general_fitness';
  const experience = profile.experience_level || 'beginner';
  const focus = profile.primary_focus || 'overall';

  const goalLabels: Record<string, string> = {
    strength: 'Strength Building',
    hypertrophy: 'Hypertrophy Focus',
    general_fitness: 'General Fitness'
  };

  const programName = experience === 'beginner' 
    ? '8-Week Foundation Program'
    : experience === 'intermediate'
    ? '10-Week Progressive Program'
    : '12-Week Advanced Block';

  const days = [];
  
  const muscleGroups = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body'];
  const exercisePool: Record<string, string[]> = {
    'Push': ['Bench Press', 'Overhead Press', 'Incline Dumbbell Press', 'Tricep Pushdowns', 'Lateral Raises'],
    'Pull': ['Deadlift', 'Barbell Rows', 'Pull-Ups', 'Face Pulls', 'Bicep Curls'],
    'Legs': ['Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Curls', 'Calf Raises'],
    'Upper': ['Bench Press', 'Barbell Rows', 'Overhead Press', 'Pull-Ups', 'Dumbbell Curls'],
    'Lower': ['Squat', 'Leg Press', 'Romanian Deadlift', 'Leg Curls', 'Lunges'],
    'Full Body': ['Squat', 'Bench Press', 'Barbell Row', 'Overhead Press', 'Deadlift']
  };

  for (let i = 0; i < daysPerWeek; i++) {
    const muscleGroup = muscleGroups[i % muscleGroups.length];
    const exercises = exercisePool[muscleGroup] || exercisePool['Full Body'];
    
    days.push({
      dayNumber: i + 1,
      name: muscleGroup + ' Day ' + (Math.floor(i / muscleGroups.length) + 1),
      muscleGroups: [muscleGroup.toLowerCase()],
      scienceRationale: 'This ' + muscleGroup.toLowerCase() + ' session follows proven muscle protein synthesis patterns with compound movements for maximum anabolic response.',
      exercises: exercises.slice(0, 5).map((ex: string, idx: number) => ({
        name: ex,
        sets: experience === 'beginner' ? 3 : 4,
        reps: goal === 'strength' ? '5' : '8-12',
        rest: goal === 'strength' ? '3 min' : '90 sec',
        rationale: ex + ' targets the primary muscle group effectively through a full range of motion, optimizing mechanical tension for ' + (goal === 'hypertrophy' ? 'muscle growth' : 'strength gains') + '.'
      }))
    });
  }

  return {
    programName: programName + ' - ' + (goalLabels[goal] || 'General Fitness'),
    weeks: experience === 'beginner' ? 8 : experience === 'intermediate' ? 10 : 12,
    daysPerWeek,
    goal: goalLabels[goal] || 'General Fitness',
    focus: focus,
    progressionScheme: experience === 'beginner' 
      ? 'Linear progression: add 5 lbs to upper body, 10 lbs to lower body each week'
      : 'Double progression: increase reps first, then add weight when hitting top of rep range',
    recoveryNotes: profile.sleep_quality === 'poor' 
      ? 'Prioritize sleep hygiene. Consider deload weeks every 4-6 weeks.'
      : profile.stress_level === 'high'
      ? 'Monitor recovery closely. Reduce volume if feeling overreached. Consider active recovery sessions.'
      : 'Maintain consistent training. Progressive overload is key to continued adaptation.',
    days
  };
}

async function getMinimaxKey(): Promise<string> {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const authPath = path.join(process.env.HOME || '', '.openclaw/agents/main/agent/auth-profiles.json');
    if (fs.existsSync(authPath)) {
      const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
      const key = auth?.profiles?.['minimax:default']?.key;
      if (key) return key;
    }
    
    const authJsonPath = path.join(process.env.HOME || '', '.openclaw/agents/main/agent/auth.json');
    if (fs.existsSync(authJsonPath)) {
      const auth = JSON.parse(fs.readFileSync(authJsonPath, 'utf8'));
      const key = auth?.minimax?.key;
      if (key) return key;
    }
  } catch (e) {
    console.error('Error reading auth files:', e);
  }
  
  return process.env.MINIMAX_API_KEY || '';
}

async function callMinimax(prompt: string): Promise<string | null> {
  const apiKey = await getMinimaxKey();
  
  if (!apiKey) {
    console.error('No Minimax API key found');
    return null;
  }

  try {
    const response = await fetch('https://api.minimax.io/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.5',
        messages: [
          {
            role: 'system',
            content: 'You are an expert fitness coach and exercise scientist. Generate personalized workout programs based on the user profile, goals, and scientific principles of training. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      console.error('Minimax API error:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '';
    content = content.replace(/<[^>]*>?/gm, '').trim();
    
    return content;
  } catch (error) {
    console.error('Minimax API error:', error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || req.cookies.get('rockyfit_user')?.value;
    const uid = parseInt(userId || '1', 10);

    // Ensure user_programs table exists
    await sql`
      CREATE TABLE IF NOT EXISTS user_programs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        program_name VARCHAR(255),
        program_data JSONB NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    const { rows: [profile] } = await sql`
      SELECT 
        experience_level,
        workout_frequency,
        goal,
        equipment,
        injuries,
        age,
        sex AS biological_sex,
        body_weight_lbs AS body_weight,
        priority_muscle AS primary_focus,
        session_duration,
        sleep_quality,
        stress_level
      FROM user_profiles 
      WHERE user_id = ${uid}
    `;

    const { rows: responses } = await sql`
      SELECT question_key, answer FROM onboarding_responses WHERE user_id = ${uid}
    `;

    const answers: Record<string, string> = {};
    responses.forEach((r: any) => {
      answers[r.question_key] = r.answer;
    });

    const userProfile = { ...profile, ...answers };

    // Fetch research snippets from DuckDuckGo for evidence-based programming
    let researchSection = '';
    try {
      const researchSnippets = await fetchResearchSnippets(userProfile);
      if (researchSnippets) {
        researchSection = `\n\nBased on the following scientific research and evidence:\n${researchSnippets}\n\n`;
      }
    } catch (e) {
      console.error('Failed to fetch research snippets:', e);
    }

    const prompt = 'Generate a personalized workout program based on the following user profile:\n\n- Experience Level: ' + (userProfile.experience_level || 'not specified') + '\n- Training Frequency: ' + (userProfile.workout_frequency || 3) + ' days per week\n- Primary Goal: ' + (userProfile.goal || 'general_fitness') + '\n- Equipment Available: ' + (userProfile.equipment || 'gym') + '\n- Injuries/Limitations: ' + (userProfile.injuries || 'none') + '\n- Age: ' + (userProfile.age || 'not specified') + '\n- Biological Sex: ' + (userProfile.biological_sex || 'not specified') + '\n- Body Weight: ' + (userProfile.body_weight || 'not specified') + ' lbs\n- Primary Focus Area: ' + (userProfile.primary_focus || 'overall balanced') + '\n- Session Duration: ' + (userProfile.session_duration || 60) + ' minutes\n- Sleep Quality: ' + (userProfile.sleep_quality || 'average') + '\n- Stress Level: ' + (userProfile.stress_level || 'moderate') + researchSection + 'Generate a complete workout program with the following JSON structure (respond ONLY with valid JSON, no markdown):\n\n{\n  "programName": "string - descriptive program name with duration",\n  "weeks": number,\n  "daysPerWeek": number,\n  "goal": "string",\n  "focus": "string",\n  "progressionScheme": "string - how to progress over time",\n  "recoveryNotes": "string - recovery recommendations based on sleep and stress",\n  "days": [\n    {\n      "dayNumber": 1,\n      "name": "string (e.g., Push Day A)",\n      "muscleGroups": ["array of muscle groups"],\n      "scienceRationale": "string (1 sentence explaining why this day is structured this way)",\n      "exercises": [\n        {\n          "name": "string",\n          "sets": number,\n          "reps": "string (e.g., 8-12 or 5)",\n          "rest": "string (e.g., 90 sec or 2 min)",\n          "rationale": "string (1 sentence why this exercise)"\n        }\n      ]\n    }\n  ]\n}\n\nRequirements:\n- For beginners: compound movements, lower frequency per muscle, simpler progressions\n- For intermediate: push/pull/legs or upper/lower split, moderate volume\n- For advanced: higher frequency, advanced techniques noted\n- Match days per week to their training frequency\n- Include 5-7 exercises per training day\n- Consider injuries when selecting exercises\n- Adjust volume based on session duration\n- Account for sleep quality and stress in recovery recommendations\n- Incorporate the scientific research principles mentioned above into your programming decisions';

    let programData = null;
    const aiResponse = await callMinimax(prompt);
    
    if (aiResponse) {
      try {
        const cleaned = aiResponse.replace(/```json|```/g, '').trim();
        programData = JSON.parse(cleaned);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
      }
    }

    if (!programData) {
      console.log('Using fallback program generator');
      programData = generateFallbackProgram(userProfile);
    }

    await sql`
      INSERT INTO user_programs (user_id, program_name, program_data, is_active)
      VALUES (${uid}, ${programData.programName}, ${JSON.stringify(programData)}, TRUE)
    `;

    await sql`
      UPDATE user_programs 
      SET is_active = FALSE 
      WHERE user_id = ${uid} AND program_name != ${programData.programName}
    `;

    return NextResponse.json(programData);
  } catch (error: any) {
    console.error('Program generation error:', error);
    return NextResponse.json({ error: 'Failed to generate program' }, { status: 500 });
  }
}
