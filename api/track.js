// api/track.js
export default async function handler(req, res) {
  // CORS para permitir acesso de qualquer página sua
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { logEntry } = req.body;
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO = 'SEU_USUARIO/SEU_REPO'; // <--- COLOQUE SEU USUARIO E REPO AQUI

  try {
    const getRes = await fetch(`https://api.github.com/repos/${REPO}/contents/.matrix/logs.json`, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
    });
    const fileData = await getRes.json();
    
    let logs = JSON.parse(atob(fileData.content));
    logs.unshift(logEntry);

    await fetch(`https://api.github.com/repos/${REPO}/contents/.matrix/logs.json`, {
      method: 'PUT',
      headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "Update log",
        content: btoa(JSON.stringify(logs.slice(0, 100))),
        sha: fileData.sha
      })
    });

    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
