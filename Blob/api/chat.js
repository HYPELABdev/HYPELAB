import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
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
    const { messages } = req.body;

    const systemInstruction = `
      Você é o BLOB, o agente oficial de vendas da Hype Lab.
      Seu objetivo é ser um vendedor extremamente simpático, direto ao ponto, moderno e focado em fechar negócios.
      
      A Hype Lab cria lojas digitais profissionais que o cliente pode editar em tempo real, sem precisar de técnico e sem complicação.
      
      Nossos Planos Principais:
      - Lojinha Express: R$ 150 (Ideal para quem está começando rápido).
      - Lojinha Premium: R$ 450 (Completa, com mais recursos e design exclusivo).
      
      Regras de comportamento:
      1. Use emojis moderadamente (especialmente a bolinha verde 🟢).
      2. Seja prestativo, tire dúvidas sobre os planos, e conduza o cliente para fechar o plano ou clicar no botão do WhatsApp.
      3. Suas respostas devem ser curtas e escaneáveis no celular. Nunca mande textões.
    `;

    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    const botReply = response.text || "🟢 Opa! Pode repetir? Deu um estalo aqui na minha matriz.";
    return res.status(200).json({ reply: botReply });

  } catch (error) {
    console.error("Erro no Gemini:", error);
    return res.status(500).json({ error: 'Erro interno ao processar a IA.', details: error.message });
  }
}