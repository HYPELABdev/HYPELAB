// api/chat.js
export default async function handler(req, res) {
  // Habilita o CORS para que seu front-end possa consultar esta API
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { messages, system } = req.body;
    const apiKey = process.env.ANTHROPIC_API_KEY; // Salvo nas variáveis de ambiente da Vercel

    if (!apiKey) {
      return res.status(500).json({ error: 'Chave da API Anthropic não configurada na Vercel.' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01' // Versão obrigatória exigida pela Anthropic
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022', // Modelo atualizado e estável do Claude 3.5 Sonnet
        max_tokens: 1000,
        system: system,
        messages: messages
      })
    });

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: 'Erro interno no servidor', details: error.message });
  }
}
