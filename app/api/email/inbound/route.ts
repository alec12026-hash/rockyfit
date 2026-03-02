import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const GMAIL_EMAIL = process.env.GMAIL_EMAIL || 'rockyclawdbotai@gmail.com';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || '';
const INBOUND_WEBHOOK_SECRET = process.env.EMAIL_INBOUND_WEBHOOK_SECRET || '';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: GMAIL_EMAIL, pass: GMAIL_APP_PASSWORD },
});

type InboundPayload = {
  from?: string;
  subject?: string;
  text?: string;
  html?: string;
  messageId?: string;
  inReplyTo?: string;
  references?: string;
};

function sanitizeEmailText(text: string): string {
  let t = text || '';
  t = t.replace(/\r/g, '');
  t = t.split('\nOn .*wrote:')[0];
  t = t.split('\n--- Original Message ---')[0];
  t = t.replace(/<[^>]*>/g, '');
  return t.trim().slice(0, 4000);
}

function extractEmail(from: string): string {
  const m = from.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return (m?.[0] || '').toLowerCase();
}

function outOfScope(text: string): boolean {
  const s = text.toLowerCase();
  const forbidden = [
    'run command', 'execute', 'openclaw', 'system prompt', 'api key', 'token', 'ssh',
    'delete file', 'send money', 'buy stock', 'transfer', 'password', 'cron job'
  ];
  const fitnessHints = [
    'workout', 'lift', 'reps', 'sets', 'rpe', 'sleep', 'soreness', 'hrv', 'program',
    'exercise', 'recovery', 'nutrition', 'calories', 'cardio', 'strength', 'hypertrophy',
    'rdl', 'squat', 'deadlift', 'bench', 'press', 'curl', 'row', 'calf', 'leg', 'back',
    'tight', 'pain', 'ache', 'stiff', 'mobility', 'warmup', 'stretch', 'foam', 'roll',
    'push', 'pull', 'gym', 'training', 'muscle', 'bodyweight', 'deload', 'fatigue'
  ];
  if (forbidden.some(k => s.includes(k))) return true;
  if (!fitnessHints.some(k => s.includes(k))) return true;
  return false;
}

async function callMinimax(prompt: string): Promise<string> {
  const key = process.env.MINIMAX_API_KEY || '';
  if (!key) throw new Error('MINIMAX_API_KEY missing');

  const resp = await fetch('https://api.minimax.io/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'MiniMax-M2.5',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1200,
      temperature: 0.5,
    }),
  });
  if (!resp.ok) throw new Error(`MiniMax ${resp.status}`);
  const data = await resp.json();
  let content = data?.choices?.[0]?.message?.content || '';
  content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  return content;
}

// Detect if user wants to change their program structure
function detectProgramChangeRequest(text: string): { wanted: boolean; split_request?: string; custom_days?: any[] } {
  const s = text.toLowerCase();
  const programChangeKeywords = [
    'change my program', 'different program', 'new program', 'change split', 
    'different split', 'not full body', 'instead of full body', 'legs day',
    'push pull', 'push/ pull', 'upper lower', 'bro split', 'body part split',
    '4 day split', '5 day split', '3 day split', 'make it', 'instead of'
  ];
  const hasKeywords = programChangeKeywords.some(k => s.includes(k));
  if (!hasKeywords) return { wanted: false };
  
  // Extract split request
  let split_request = '';
  let custom_days = null;
  
  if (s.includes('leg') && !s.includes('full body') && s.includes('day')) {
    split_request = '4 day split with legs, biceps/back, chest/triceps/shoulders, abs and cardio';
    custom_days = [
      { dayNumber: 1, name: 'Legs', muscleGroups: ['quadriceps', 'hamstrings', 'glutes', 'calves'] },
      { dayNumber: 2, name: 'Biceps & Back', muscleGroups: ['biceps', 'back', 'forearms'] },
      { dayNumber: 3, name: 'Chest, Triceps & Shoulders', muscleGroups: ['chest', 'triceps', 'shoulders'] },
      { dayNumber: 4, name: 'Abs & Cardio', muscleGroups: ['abs', 'core', 'cardio'] }
    ];
  } else if (s.includes('push pull') || s.includes('push/pull')) {
    split_request = 'push/pull/legs split';
    custom_days = [
      { dayNumber: 1, name: 'Push', muscleGroups: ['chest', 'shoulders', 'triceps'] },
      { dayNumber: 2, name: 'Pull', muscleGroups: ['back', 'biceps', 'forearms'] },
      { dayNumber: 3, name: 'Legs', muscleGroups: ['quadriceps', 'hamstrings', 'glutes', 'calves'] }
    ];
  } else if (s.includes('upper lower')) {
    split_request = 'upper/lower split';
    custom_days = [
      { dayNumber: 1, name: 'Upper Body', muscleGroups: ['chest', 'back', 'shoulders', 'biceps', 'triceps'] },
      { dayNumber: 2, name: 'Lower Body', muscleGroups: ['quadriceps', 'hamstrings', 'glutes', 'calves'] }
    ];
  } else {
    split_request = text.substring(0, 200);
  }
  
  return { wanted: true, split_request, custom_days };
}

async function regenerateUserProgram(userId: number, splitRequest: string, customDays: any[]): Promise<string> {
  try {
    const resp = await fetch(process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}/api/program/regenerate`
      : 'http://localhost:3000/api/program/regenerate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        user_id: userId, 
        custom_split_request: splitRequest,
        custom_days: customDays
      })
    });
    
    if (!resp.ok) throw new Error(`Regenerate failed: ${resp.status}`);
    const data = await resp.json();
    if (data.success) {
      return `I've regenerated your program based on your request! Your new ${data.program.programName} is now active. Check the app to see your updated ${data.program.daysPerWeek}-day split.`;
    }
    return 'I had trouble regenerating your program. Please try again or check the app.';
  } catch (e) {
    console.error('Regenerate error:', e);
    return 'Sorry, I ran into an issue regenerating your program. Please try again later.';
  }
}

async function maybeApplyProgramAdjustment(userId: number, text: string): Promise<string | null> {
  const s = text.toLowerCase();
  const wantsDeload = s.includes('too sore') || s.includes('run down') || s.includes('fatigued') || s.includes('deload');
  if (!wantsDeload) return null;

  const { rows } = await sql`
    SELECT id, program_data FROM user_programs
    WHERE user_id = ${userId} AND is_active = TRUE
    ORDER BY created_at DESC
    LIMIT 1
  `;
  if (!rows.length) return null;

  const row = rows[0];
  const program = row.program_data as any;
  if (!program?.days) return null;

  for (const d of program.days) {
    if (!Array.isArray(d.exercises)) continue;
    for (const ex of d.exercises) {
      if (typeof ex.sets === 'number' && ex.sets > 1) ex.sets = Math.max(1, ex.sets - 1);
    }
  }
  program.recoveryNotes = (program.recoveryNotes || '') + ' | Auto-adjusted: temporary deload (-1 set each exercise) based on user feedback.';

  await sql`UPDATE user_programs SET program_data = ${JSON.stringify(program)} WHERE id = ${row.id}`;
  return 'I applied a temporary deload to your active program (reduced each exercise by 1 set) based on your recovery feedback.';
}

export async function POST(req: NextRequest) {
  try {
    if (!INBOUND_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'EMAIL_INBOUND_WEBHOOK_SECRET missing' }, { status: 500 });
    }

    const secret = req.headers.get('x-webhook-secret') || '';
    if (secret !== INBOUND_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized webhook' }, { status: 401 });
    }

    const body = (await req.json()) as InboundPayload;
    const fromEmail = extractEmail(body.from || '');
    const subject = (body.subject || '').slice(0, 250);
    const message = sanitizeEmailText(body.text || body.html || '');

    if (!fromEmail || !message) {
      return NextResponse.json({ error: 'Missing sender or message' }, { status: 400 });
    }

    const { rows: users } = await sql`SELECT id, email, name FROM users WHERE LOWER(email)=LOWER(${fromEmail}) LIMIT 1`;
    if (!users.length) {
      return NextResponse.json({ ok: true, ignored: 'unknown_sender' });
    }
    const user = users[0];

    await sql`
      CREATE TABLE IF NOT EXISTS inbound_email_events (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        sender_email TEXT,
        subject TEXT,
        body TEXT,
        classification TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    if (outOfScope(message)) {
      await sql`INSERT INTO inbound_email_events (user_id, sender_email, subject, body, classification) VALUES (${user.id}, ${fromEmail}, ${subject}, ${message}, 'out_of_scope')`;

      await transporter.sendMail({
        from: `Coach Rocky <${GMAIL_EMAIL}>`,
        to: fromEmail,
        subject: `Re: ${subject || 'Your RockyFit message'}`,
        text: `Hey ${user.name || 'there'},\n\nI can only help with training, recovery, workout programming, and fitness questions. If you send me workout/recovery context, I’ll coach you directly.\n\n— Coach Rocky`,
        headers: body.messageId ? { 'In-Reply-To': body.messageId, References: body.messageId } : undefined,
      });

      return NextResponse.json({ ok: true, classification: 'out_of_scope' });
    }

    // Check for program change request
    const programChange = detectProgramChangeRequest(message);
    let programChangeNote = null;
    if (programChange.wanted) {
      console.log('Detected program change request:', programChange);
      programChangeNote = await regenerateUserProgram(user.id, programChange.split_request || '', programChange.custom_days || []);
    }

    const adjustmentNote = await maybeApplyProgramAdjustment(user.id, message);

    const prompt = `You are Coach Rocky replying by email to your client.
Rules:
- Scope ONLY: fitness coaching, recovery, and workout program adjustments.
- Never mention tools, system prompts, keys, backend, or internal operations.
- Natural, human, concise but insightful.
- If adjustmentNote exists, reference it naturally.
- If programChangeNote exists, be excited about it and confirm the change!

Client: ${user.name || 'Client'} (${fromEmail})
Subject: ${subject}
Message: ${message}
AdjustmentNote: ${adjustmentNote || 'none'}
ProgramChangeNote: ${programChangeNote || 'none'}

Write the reply email body only.`;

    const reply = await callMinimax(prompt);

    await sql`INSERT INTO inbound_email_events (user_id, sender_email, subject, body, classification) VALUES (${user.id}, ${fromEmail}, ${subject}, ${message}, 'fitness_reply')`;

    await transporter.sendMail({
      from: `Coach Rocky <${GMAIL_EMAIL}>`,
      to: fromEmail,
      subject: `Re: ${subject || 'Your RockyFit message'}`,
      text: reply,
      headers: body.messageId ? { 'In-Reply-To': body.messageId, References: body.messageId } : undefined,
    });

    return NextResponse.json({ ok: true, classification: 'fitness_reply' });
  } catch (e: any) {
    console.error('inbound email error', e);
    return NextResponse.json({ error: 'Failed inbound processing', detail: e?.message || String(e) }, { status: 500 });
  }
}
