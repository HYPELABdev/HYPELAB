// api/chat.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      systemInstruction: system || 'Você é o BLOB, agente de vendas da Hype Lab.'
    });

    const lastMessageObj = messages[messages.length - 1];
    const userPrompt = lastMessageObj ? lastMessageObj.content : '';

    if (!userPrompt) return res.status(400).json({ error: 'Mensagem vazia.' });

    const rawHistory = messages.slice(0, -1);
    const chatHistory = [];

    rawHistory.forEach(msg => {
      if (msg.role === 'user' || msg.role === 'assistant') {
        const role = msg.role === 'assistant' ? 'model' : 'user';
        if (chatHistory.length === 0 && role === 'model') return;
        if (chatHistory.length === 0 || chatHistory[chatHistory.length - 1].role !== role) {
          chatHistory.push({ role, parts: [{ text: msg.content || '' }] });
        }
      }
    });

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(userPrompt);
    const response = await result.response;
    const replyText = response.text();

    return res.status(200).json({ content: [{ text: replyText }] });

  } catch (error) {
    console.error("Erro no Gemini:", error);
    return res.status(200).json({
      content: [{ text: `Tive um problema técnico: ${error.message}. Tenta de novo? 😅` }]
    });
  }
};