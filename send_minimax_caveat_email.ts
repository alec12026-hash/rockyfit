import nodemailer from 'nodemailer';
import fs from 'fs';

async function main() {
  for (const line of fs.readFileSync('/home/ec2-user/.env','utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }

  const body = `Quick note before the comparison: the direct Minimax API auth path I used for the one-off email test failed outside the normal app runtime, which is why the last email rendered blank. That's on me.

So instead of sending you another broken email, here's the useful comparison point:

If we tune Minimax correctly, the report should still keep the same structure:

Session Read
Recovery Read
Coach's Call
Coach wants to know

Where it will usually differ from the GPT-5.4-style version:
- slightly less sharp interpretation
- less elegant transitions
- a little more templated phrasing
- usually good enough if the inputs are strong

What we need to do next to make the real Minimax version work correctly:
1. move report generation through the same working app/runtime path
2. fix provider auth handling so Minimax is called the same way everywhere
3. keep the stronger coaching schema and examples we just built
4. compare the outputs side by side once the runtime path is clean

Bottom line: the blank email was not a writing problem. It was an auth/runtime integration problem. The coaching format improvements still stand, and the next step is wiring Minimax through the proper production path instead of this hacked one-off path.`;

  const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;line-height:1.7;color:#27272a;max-width:720px;margin:0 auto;padding:24px;background:#f5f7fb;"><div style="background:#111827;color:#fff;padding:28px;border-radius:16px 16px 0 0;"><div style="font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#cbd5e1;">🏋️ RockyFit Daily Coaching Report</div><div style="font-size:14px;color:#cbd5e1;margin-top:8px;">Minimax comparison correction</div></div><div style="background:#ffffff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;padding:28px;"><p style="white-space:pre-line;margin:0;font-size:16px;">${body.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p></div></body></html>`;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_EMAIL, pass: process.env.GMAIL_APP_PASSWORD }
  });
  await transporter.sendMail({
    from: `Coach Rocky <${process.env.GMAIL_EMAIL}>`,
    to: 'alec12026@gmail.com',
    subject: 'CORRECTION: Minimax RockyFit report comparison',
    html,
  });
  console.log('sent correction');
}
main().catch(err => { console.error(err); process.exit(1); });
