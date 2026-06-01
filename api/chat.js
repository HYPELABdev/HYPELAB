const { GoogleGenerativeAI } = require('@google/generative-ai');

// Inicializa a API com a chave da Vercel
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = async (req, res) => {
  // Configuração de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { messages, system } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(200).json({
        content: [{ text: "[STATE:idle] 🟢 Oi! Sou o BLOB. Como posso te ajudar hoje?" }]
      });
    }

    // Instancia o modelo Gemini 1.5 Flash
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: system || 'Você é o BLOB, agente de vendas da Hype Lab.'
    });

    // Pega apenas a última mensagem que o usuário acabou de digitar
    const lastMessageObj = messages[messages.length - 1];
    const userPrompt = lastMessageObj ? lastMessageObj.content : '';

    if (!userPrompt) {
      return res.status(400).json({ error: 'Mensagem vazia.' });
    }

    // Monta o histórico anterior (removendo a última mensagem que vai ser enviada agora)
    const rawHistory = messages.slice(0, -1);
    const chatHistory = [];

    // Limpa e valida o histórico para o Gemini aceitar sem chiar
    rawHistory.forEach(msg => {
      if (msg.role === 'user' || msg.role === 'assistant') {
        const role = msg.role === 'assistant' ? 'model' : 'user';
        // Evita duplicar papéis seguidos no histórico, o que quebra o Gemini
        if (chatHistory.length === 0 || chatHistory[chatHistory.length - 1].role !== role) {
          chatHistory.push({
            role: role,
            parts: [{ text: msg.content || '' }]
          });
        }
      }
    });

    // Inicia o chat com o histórico higienizado
    const chat = model.startChat({
      history: chatHistory
    });

    // Envia o prompt atual
    const result = await chat.sendMessage(userPrompt);
    const response = await result.response;
    const replyText = response.text();

    // Devolve no formato exato que o seu index.html precisa ler
    return res.status(200).json({
      content: [{ text: replyText }]
    });

  } catch (error) {
    console.error("Erro no Gemini:", error);
    // Retorna o erro detalhado para o seu chat exibir se algo der errado na API
    return res.status(200).json({
      content: [{ text: `Tive um problema técnico: ${error.message}. Tenta de novo? 😅` }]
    });
  }
};
