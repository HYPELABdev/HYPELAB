export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    const { messages, system } = req.body;
    const apiKey = process.env.OPENROUTER_API_KEY; 

    if (!apiKey) {
      return res.status(500).json({ error: 'Chave OPENROUTER_API_KEY não configurada na Vercel.' });
    }

    const formattedMessages = [
      { role: 'system', content: system },
      ...messages
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3-8b-instruct:free', 
        messages: formattedMessages,
        temperature: 0.7
      })
    });

    const data = await response.json();
    const replyText = data.choices?.[0]?.message?.content || 'Tive um problema ao processar a resposta. 😅';
    
    return res.status(200).json({
      content: [{ type: 'text', text: replyText }]
    });

  } catch (error) {
    return res.status(500).json({ error: 'Erro interno no servidor', details: error.message });
  }
}