import fs from 'fs';
async function main() {
  const keyLine = fs.readFileSync('/home/ec2-user/.openclaw/agents/main/agent/auth-profiles.json','utf8');
  const key = JSON.parse(keyLine).profiles['minimax:default'].key;
  const resp = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
    body: JSON.stringify({
      model: 'MiniMax-M2.5',
      messages: [{ role: 'user', content: 'Reply with exactly: hello world' }],
      tokens_to_generate: 50,
      temperature: 0.1,
    })
  });
  const text = await resp.text();
  console.log(text);
}
main().catch(err => { console.error(err); process.exit(1); });
