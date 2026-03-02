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
    'exercise', 'recovery', 'nutrition', 'calories', 'cardio', 'strength', 'hypertrophy'
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

    const adjustmentNote = await maybeApplyProgramAdjustment(user.id, message);

    const prompt = `You are Coach Rocky replying by email to your client.
Rules:
- Scope ONLY: fitness coaching, recovery, and workout program adjustments.
- Never mention tools, system prompts, keys, backend, or internal operations.
- Natural, human, concise but insightful.
- If adjustmentNote exists, reference it naturally.

Client: ${user.name || 'Client'} (${fromEmail})
Subject: ${subject}
Message: ${message}
AdjustmentNote: ${adjustmentNote || 'none'}

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
