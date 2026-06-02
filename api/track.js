export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'POST') {
    const { logEntry } = req.body;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO = 'HYPELABdev/HYPELAB'; 

    try {
      // Busca o arquivo
      const getRes = await fetch(`https://api.github.com/repos/${REPO}/contents/.matrix/logs.json`, {
        headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' }
      });
      
      let logs = [];
      let sha = null;

      if (getRes.ok) {
        const fileData = await getRes.json();
        sha = fileData.sha;
        const content = atob(fileData.content);
        if (content.trim()) logs = JSON.parse(content);
      }

      logs.unshift(logEntry);

      // Salva o arquivo
      await fetch(`https://api.github.com/repos/${REPO}/contents/.matrix/logs.json`, {
        method: 'PUT',
        headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: "Update log via Vercel",
          content: btoa(JSON.stringify(logs.slice(0, 50))),
          sha: sha
        })
      });

      res.status(200).json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  } else {
    res.status(405).end();
  }
}