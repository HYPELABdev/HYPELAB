const { GoogleGenerativeAI } = require('@google/generative-ai');

// Inicializa a API clássica com a chave da Vercel
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  // Libera o CORS para o site funcionar
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
      return res.status(400).json({ error: 'Mensagens ausentes ou inválidas' });
    }

    // Instancia o modelo clássico Gemini 1.5 Flash
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: system || 'Você é o BLOB, agente da Hype Lab.'
    });

    // Formata o histórico exatamente como a biblioteca clássica exige
    // Ignora mensagens de sistema antigas que possam estar no meio
    const chatHistory = messages
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

    // Remove a última mensagem para iniciar o chat e enviar ela como o novo prompt
    const lastMessage = chatHistory.pop();
    
    if (!lastMessage) {
      return res.status(400).json({ error: 'Nenhuma mensagem para enviar.' });
    }

    // Inicia a conversa com o histórico restante
    const chat = model.startChat({
      history: chatHistory
    });

    // Envia a última mensagem do usuário
    const result = await chat.sendMessage(lastMessage.parts[0].text);
    const response = await result.response;
    const replyText = response.text();

    // Devolve o formato exato que o seu index.html precisa: data.content[0].text
    return res.status(200).json({
      content: [{ text: replyText }]
    });

  } catch (error) {
    console.error("Erro interno no back-end:", error);
    return res.status(500).json({ error: 'Erro ao processar IA.', details: error.message });
  }
}