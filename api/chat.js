// api/chat.js — Groq primeiro, fallback automático para Gemini
// Groq: 14.400/dia grátis | Gemini: 1.500/dia grátis

const { GoogleGenerativeAI } = require('@google/generative-ai');

// ── Groq ──────────────────────────────────────────────────
async function callGroq(groqMessages) {
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
    const err = await response.json().catch(() => ({}));
    const status = response.status;
    // 429 = limite atingido, 503 = indisponível — faz fallback
    // Outros erros (401 chave errada, etc.) também fazem fallback
    throw new Error(`GROQ_${status}: ${err?.error?.message || 'erro desconhecido'}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// ── Gemini ────────────────────────────────────────────────
async function callGemini(messages, system) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    systemInstruction: system || 'Você é o BLOB, agente de vendas da Hype Lab.'
  });

  const lastMsg = messages[messages.length - 1];
  const userPrompt = lastMsg?.content || '';
  const rawHistory = messages.slice(0, -1);
  const chatHistory = [];

  rawHistory.forEach(msg => {
    if (msg.role === 'user' || msg.role === 'assistant') {
      const role = msg.role === 'assistant' ? 'model' : 'user';
      if (chatHistory.length === 0 && role === 'model') return;
      if (!chatHistory.length || chatHistory[chatHistory.length - 1].role !== role) {
        chatHistory.push({ role, parts: [{ text: msg.content || '' }] });
      }
    }
  });

  const chat = model.startChat({ history: chatHistory });
  const result = await chat.sendMessage(userPrompt);
  return result.response.text();
}

// ── Handler principal ─────────────────────────────────────
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
        content: [{ text: '[STATE:idle] 🟢 Oi! Sou o BLOB. Como posso te ajudar hoje?' }]
      });
    }

    const groqMessages = [
      { role: 'system', content: system || 'Você é o BLOB, agente de vendas da Hype Lab.' },
      ...messages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content || ''
      }))
    ];

    let replyText = '';
    let usedProvider = 'groq';

    // Tenta Groq primeiro
    try {
      replyText = await callGroq(groqMessages);
      console.log('[BLOB] Respondeu via Groq ✅');
    } catch (groqErr) {
      console.warn(`[BLOB] Groq falhou (${groqErr.message}) — tentando Gemini...`);
      usedProvider = 'gemini';

      // Fallback para Gemini
      try {
        replyText = await callGemini(messages, system);
        console.log('[BLOB] Respondeu via Gemini ✅');
      } catch (geminiErr) {
        console.error('[BLOB] Gemini também falhou:', geminiErr.message);
        // Ambos falharam — devolve mensagem amigável
        return res.status(200).json({
          content: [{ text: 'Estou com uma instabilidade agora 😅 Tenta de novo em alguns segundos ou fala direto no <a href="https://wa.me/5511949946730" target="_blank">WhatsApp</a>!' }]
        });
      }
    }

    if (!replyText) {
      replyText = 'Tive um problema! Tenta de novo? 😅';
    }

    return res.status(200).json({
      content: [{ text: replyText }],
      _provider: usedProvider // útil para debug nos logs da Vercel
    });

  } catch (error) {
    console.error('[BLOB] Erro geral:', error);
    return res.status(200).json({
      content: [{ text: `Tive um problema técnico: ${error.message}. Tenta de novo? 😅` }]
    });
  }
};
