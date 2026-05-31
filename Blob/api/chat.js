const { GoogleGenerativeAI } = require('@google/generative-ai');

// Inicializa a API com a chave cadastrada nas variáveis de ambiente da Vercel
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = async (req, res) => {
  // Configuração de CORS para permitir a comunicação com o front-end
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

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Histórico de mensagens inválido.' });
    }

    // Configura o modelo com as instruções do vendedor passadas pelo index.html
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: system || 'Você é o BLOB, agente da Hype Lab.'
    });

    // Formata o histórico de mensagens para o padrão do Gemini (user / model)
    const chatHistory = messages
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

    // Remove a última mensagem enviada para usá-la como o gatilho atual do chat
    const lastMessage = chatHistory.pop();
    
    if (!lastMessage) {
      return res.status(400).json({ error: 'Nenhuma mensagem encontrada.' });
    }

    // Inicia a conversa mantendo a memória do chat anterior
    const chat = model.startChat({
      history: chatHistory
    });

    // Envia a mensagem e aguarda a resposta do Gemini
    const result = await chat.sendMessage(lastMessage.parts[0].text);
    const response = await result.response;
    const replyText = response.text();

    // Retorna exatamente a estrutura de objeto que o seu index.html precisa ler
    return res.status(200).json({
      content: [{ text: replyText }]
    });

  } catch (error) {
    console.error("Erro interno no servidor da Vercel:", error);
    return res.status(500).json({ error: 'Erro ao processar IA.', details: error.message });
  }
};
