import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

// POST /api/email/coaching - Queue a coaching email for delivery
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, subject, body: emailBody, scheduledAt } = body;
    
    if (!userId || !subject || !emailBody) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Check user's email preferences
    const prefs = await sql`
      SELECT email, email_coaching_enabled, telegram_chat_id
      FROM user_profiles
      WHERE user_id = ${userId}
    `;
    
    if (prefs.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const user = prefs.rows[0];
    
    // Check if email coaching is enabled
    if (!user.email_coaching_enabled || !user.email) {
      return NextResponse.json({ 
        success: false, 
        reason: 'Email coaching not enabled for this user' 
      });
    }
    
    // Queue the email
    const result = await sql`
      INSERT INTO coaching_emails (user_id, subject, body, scheduled_at, status)
      VALUES (${userId}, ${subject}, ${emailBody}, ${scheduledAt || new Date().toISOString()}, 'pending')
      RETURNING id
    `;
    
    // TODO: In production, this would trigger an actual email send via Resend/SendGrid
    // For now, we just queue it
    
    return NextResponse.json({ 
      success: true, 
      emailId: result.rows[0].id,
      recipient: user.email
    });
  } catch (error) {
    console.error('Error queueing coaching email:', error);
    return NextResponse.json({ error: 'Failed to queue email' }, { status: 500 });
  }
}

// GET /api/email/coaching - Get pending emails for processing (for cron job)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status') || 'pending';
    
    let query;
    if (userId) {
      query = await sql`
        SELECT ce.*, u.email, u.name
        FROM coaching_emails ce
        JOIN users u ON u.id = ce.user_id
        WHERE ce.user_id = ${userId} AND ce.status = ${status}
        ORDER BY ce.scheduled_at ASC
        LIMIT 50
      `;
    } else {
      query = await sql`
        SELECT ce.*, u.email, u.name
        FROM coaching_emails ce
        JOIN users u ON u.id = ce.user_id
        WHERE ce.status = ${status} AND ce.scheduled_at <= NOW()
        ORDER BY ce.scheduled_at ASC
        LIMIT 50
      `;
    }
    
    return NextResponse.json({ emails: query.rows });
  } catch (error) {
    console.error('Error fetching coaching emails:', error);
    return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
  }
}
