import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const GMAIL_EMAIL = process.env.GMAIL_EMAIL || 'rockyclawdbotai@gmail.com';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || '';

export async function GET() {
  const result: any = { 
    hasEmail: Boolean(GMAIL_EMAIL), 
    hasPassword: Boolean(GMAIL_APP_PASSWORD),
    passwordLength: GMAIL_APP_PASSWORD.length 
  };

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_EMAIL, pass: GMAIL_APP_PASSWORD },
    });
    
    await transporter.sendMail({
      from: `Test <${GMAIL_EMAIL}>`,
      to: 'alec12026@gmail.com',
      subject: 'RockyFit Test Email',
      text: 'Test email from RockyFit - if you got this, nodemailer works!',
    });
    
    result.sent = true;
  } catch (e: any) {
    result.error = e.message;
  }

  return NextResponse.json(result);
}
