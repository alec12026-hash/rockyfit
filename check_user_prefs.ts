import { sql } from '@vercel/postgres';
async function main() {
  const res = await sql`SELECT u.id, u.email, up.coaching_report_enabled, up.coaching_report_time FROM users u LEFT JOIN user_preferences up ON u.id = up.user_id WHERE u.id = 1`;
  console.log(JSON.stringify(res.rows, null, 2));
}
main().catch(err => { console.error(err); process.exit(1); });
