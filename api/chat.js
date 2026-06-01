// api/chat.js — Groq (Llama 3.3 70B) — 14.400 pedidos/dia grátis

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    const { messages, system } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(200).json({
        content: [{ text: "[STATE:idle] 🟢 Oi! Sou o BLOB. Como posso te ajudar hoje?" }]
      });
    }

    // Monta o histórico no formato OpenAI (compatível com Groq)
    const groqMessages = [
      { role: 'system', content: system || 'Você é o BLOB, agente de vendas da Hype Lab.' },
      ...messages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content || ''
      }))
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: groqMessages,
        max_tokens: 1024,
        temperature: 0.75
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Groq API error:', err);
      throw new Error(`Groq respondeu com status ${response.status}`);
    }

    const data = await response.json();
    const replyText = data.choices?.[0]?.message?.content || 'Tive um problema! Tenta de novo? 😅';

    return res.status(200).json({
      content: [{ text: replyText }]
    });

  } catch (error) {
    console.error('Erro no Groq:', error);
    return res.status(200).json({
      content: [{ text: `Tive um problema técnico: ${error.message}. Tenta de novo? 😅` }]
    });
  }
};
