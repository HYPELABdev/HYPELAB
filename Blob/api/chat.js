// api/chat.js (Versão OpenRouter Gratuita)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    const { messages, system } = req.body;
    
    // Você vai criar uma conta no openrouter.ai e gerar sua chave lá
    const apiKey = process.env.OPENROUTER_API_KEY; 

    if (!apiKey) {
      return res.status(500).json({ error: 'Chave OPENROUTER_API_KEY não configurada na Vercel.' });
    }

    // Injeta o System Prompt dentro do histórico (necessário para o OpenRouter/Llama)
    const formattedMessages = [
      { role: 'system', content: system },
      ...messages
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://hypelab.com.br', // Opcional (Seu site)
        'X-Title': 'BLOB Agente' // Opcional
      },
      body: JSON.stringify({
        // Modelo do Llama 3 8B que é super rápido e TOTALMENTE GRATUITO no OpenRouter
        model: 'meta-llama/llama-3-8b-instruct:free', 
        messages: formattedMessages,
        temperature: 0.7
      })
    });

    const data = await response.json();
    
    // Adapta o formato de resposta do OpenRouter para o padrão que seu Front-end espera
    const replyText = data.choices?.[0]?.message?.content || '';
    const formattedResponse = {
      content: [{ type: 'text', text: replyText }]
    };

    return res.status(200).json(formattedResponse);

  } catch (error) {
    return res.status(500).json({ error: 'Erro no servidor', details: error.message });
  }
}