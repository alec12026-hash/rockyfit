import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API Key not configured.' }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey });
    const { logs } = await req.json();

    if (!logs || logs.length === 0) {
      return NextResponse.json({ message: "No workout data provided." }, { status: 400 });
    }

    // Format logs for the AI
    const prompt = `
      You are an expert strength coach named Rocky.
      Review the following workout data for an advanced lifter (12 years exp).
      Analyze volume, intensity, and progression.
      Give 1 specific, actionable tip for the next session.
      Keep it short, blunt, and scientific. No fluff.

      Workout Data:
      ${JSON.stringify(logs, null, 2)}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a professional strength and conditioning coach." },
        { role: "user", content: prompt }
      ],
      max_tokens: 150,
    });

    const advice = completion.choices[0].message.content;

    return NextResponse.json({ advice });
  } catch (error) {
    console.error('Error in coach API:', error);
    return NextResponse.json({ error: 'Failed to get coaching advice.' }, { status: 500 });
  }
}
