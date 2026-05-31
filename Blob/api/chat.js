import { GoogleGenAI } from '@google/genai';

// Inicializa a API do Gemini com a sua chave salva na Vercel
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
  // Configuração de CORS para permitir que o site acesse a API
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
    // Pega as mensagens e o prompt do sistema vindos do index.html
    const { messages, system } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Histórico de mensagens inválido ou ausente.' });
    }

    // Filtra e formata o histórico para o formato exato exigido pelo Gemini
    const contents = messages
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

    // Executa a chamada do Gemini 1.5 Flash
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: contents,
      config: {
        systemInstruction: system || 'Você é o BLOB, agente da Hype Lab.',
        temperature: 0.7,
      }
    });

    // Formata a resposta para o padrão que o seu index.html espera ler (data.content[0].text)
    const replyText = response.text || "🟢 Opa! Pode repetir? Deu um estalo aqui na minha matriz.";
    
    return res.status(200).json({
      content: [{ text: replyText }]
    });

  } catch (error) {
    console.error("Erro interno no Gemini:", error);
    return res.status(500).json({ error: 'Erro ao processar inteligência artificial.', details: error.message });
  }
}