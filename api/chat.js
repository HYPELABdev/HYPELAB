const { GoogleGenerativeAI } = require('@google/generative-ai');

// CORREÇÃO DEFINITIVA: Força o SDK a usar a rota estável 'v1' e ignora a 'v1beta' antiga
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY, "v1");

module.exports = async (req, res) => {
  // Configuração de CORS para permitir que seu site converse com a API
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

    // Instancia o modelo moderno e rápido com as diretrizes do BLOB
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: system || 'Você é o BLOB, agente de vendas da Hype Lab.'
    });

    // Captura a última mensagem enviada pelo usuário
    const lastMessageObj = messages[messages.length - 1];
    const userPrompt = lastMessageObj ? lastMessageObj.content : '';

    if (!userPrompt) {
      return res.status(400).json({ error: 'Mensagem vazia.' });
    }

    // Isola o histórico anterior
    const rawHistory = messages.slice(0, -1);
    const chatHistory = [];

    // Higieniza o histórico para o Gemini aceitar sem dar erro de validação
    rawHistory.forEach(msg => {
      if (msg.role === 'user' || msg.role === 'assistant') {
        const role = msg.role === 'assistant' ? 'model' : 'user';
        
        // Garante que o histórico não comece com a mensagem do robô
        if (chatHistory.length === 0 && role === 'model') {
          return; 
        }

        // Evita duplicar papéis seguidos no array do histórico
        if (chatHistory.length === 0 || chatHistory[chatHistory.length - 1].role !== role) {
          chatHistory.push({
            role: role,
            parts: [{ text: msg.content || '' }]
          });
        }
      }
    });

    // Inicia a sessão de chat estruturada
    const chat = model.startChat({
      history: chatHistory
    });

    // Envia a mensagem do usuário e aguarda o retorno da IA
    const result = await chat.sendMessage(userPrompt);
    const response = await result.response;
    const replyText = response.text();

    // Entrega a resposta no formato exato esperado pelo front-end do seu chat
    return res.status(200).json({
      content: [{ text: replyText }]
    });

  } catch (error) {
    console.error("Erro no Gemini:", error);
    // Devolve o erro na tela para sabermos exatamente o que houve se falhar
    return res.status(200).json({
      content: [{ text: `Tive um problema técnico: [GoogleGenerativeAI Error]: ${error.message}. Tenta de novo? 😅` }]
    });
  }
};
