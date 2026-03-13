import nodemailer from 'nodemailer';
import fs from 'fs';

async function main() {
  for (const line of fs.readFileSync('/home/ec2-user/.env','utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }

  const body = `🏋️ ROCKYFIT DAILY COACHING REPORT 🏋️
Sunday, March 8, 2026

Session Read
Today was a clean Pull B session, Alec, but the important part is where the stress actually showed up. Meadows rows were controlled at 50 pounds for three sets of ten at RPE 8, straight-arm work stayed smooth, and waiter curls were steady. The limiter was clearly the pullups: 9, 8, and 8 reps at RPE 10. Rear delt flys were also pushed hard at 105 for 11, 11, and 10, all at RPE 10, so by the end of the session local fatigue was doing more damage than global fatigue. That matters. This was not a bad session at all, but it was a session where the smaller pulling muscles and stabilizers started waving the flag before the broader workload fell apart. Total volume landed at 6,720 pounds. No PRs, but still a useful day.

Recovery Read
Recovery is where the bigger story is tonight. Sleep came in at 6.85 hours, which is fine but not ideal, resting heart rate was a solid 48, but HRV dropped all the way to 28.9 and readiness landed at 59 in the yellow zone. That is a very different look from your last green day, where readiness was 77 and HRV was much higher. So the workout held together better than the recovery data did. Over the last 7 days you logged 5 sessions and moved roughly 51,272 pounds total, and over the last 30 days you've hit 24 PRs. That's real momentum — but it's also exactly the kind of run where people mistake progress for unlimited recovery. Given your history of tight biceps, triceps, and forearms feeding into upper-back issues, this is the kind of dip I take seriously.

Coach's Call
Tomorrow is not a "push because momentum feels good" day. It is a hold-and-assess day. If the next session warmups feel sharp, fine — let the main movement earn progression. But if grip feels dead, pull strength feels suppressed early, or you notice any arm or upper-back tightness, don't force it. I want forearm and upper-back maintenance built in tonight and tomorrow: wrist curls or reverse curls, light forearm work, and some hanging or decompression work for the upper back. The key here is getting ahead of fatigue accumulation before it turns into one of your usual flare-up patterns.

Coach wants to know
Did the pullups feel hard because your lats and upper back were truly taxed, or did it feel more like grip, forearms, and arm tightness were the real bottleneck by the end of the workout?`;

  const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;line-height:1.7;color:#27272a;max-width:720px;margin:0 auto;padding:24px;background:#f5f7fb;"><div style="background:#111827;color:#fff;padding:28px;border-radius:16px 16px 0 0;"><div style="font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#cbd5e1;">🏋️ RockyFit Daily Coaching Report</div><div style="font-size:14px;color:#cbd5e1;margin-top:8px;">Sunday, March 8, 2026</div></div><div style="background:#ffffff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;padding:28px;"><p style="white-space:pre-line;margin:0;font-size:16px;">${body.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p></div></body></html>`;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_EMAIL, pass: process.env.GMAIL_APP_PASSWORD }
  });

  await transporter.sendMail({
    from: `Coach Rocky <${process.env.GMAIL_EMAIL}>`,
    to: 'alec12026@gmail.com',
    subject: 'UPDATED EXAMPLE: RockyFit Daily Coaching Report',
    html,
  });
  console.log('sent updated example');
}

main().catch(err => { console.error(err); process.exit(1); });
