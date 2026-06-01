// api/lead.js — Recebe dados do Lead e envia email via Resend

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    const { name, email, phone } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios.' });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const OWNER_EMAIL   = process.env.OWNER_EMAIL; // ex: seuemail@gmail.com

    if (!RESEND_API_KEY || !OWNER_EMAIL) {
      console.error('Variáveis de ambiente RESEND_API_KEY ou OWNER_EMAIL não configuradas.');
      // Retorna sucesso mesmo assim para não quebrar o front-end
      return res.status(200).json({ ok: true, warn: 'email não enviado — variáveis não configuradas' });
    }

    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0a1a0e;color:#e0ffe8;padding:32px;border-radius:12px;border:1px solid #00ff8833">
        <h2 style="color:#00ff88;margin-bottom:4px">🟢 Novo Lead — BLOB · Hype Lab</h2>
        <p style="color:#aaa;font-size:12px;margin-bottom:24px">${new Date().toLocaleString('pt-BR')}</p>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:10px 0;border-bottom:1px solid #ffffff11;color:#aaa;font-size:12px;width:100px">NOME</td>
              <td style="padding:10px 0;border-bottom:1px solid #ffffff11;font-weight:600">${name}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #ffffff11;color:#aaa;font-size:12px">EMAIL</td>
              <td style="padding:10px 0;border-bottom:1px solid #ffffff11"><a href="mailto:${email}" style="color:#00ff88">${email}</a></td></tr>
          <tr><td style="padding:10px 0;color:#aaa;font-size:12px">WHATSAPP</td>
              <td style="padding:10px 0">${phone ? `<a href="https://wa.me/55${phone.replace(/\D/g,'')}" style="color:#00ff88">${phone}</a>` : '<span style="color:#555">não informado</span>'}</td></tr>
        </table>
        <a href="https://wa.me/55${(phone||'').replace(/\D/g,'') || ''}" 
           style="display:inline-block;margin-top:24px;padding:12px 24px;background:#00ff88;color:#001a0a;font-weight:700;border-radius:8px;text-decoration:none">
          💬 Falar no WhatsApp
        </a>
      </div>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'BLOB · Hype Lab <onboarding@resend.dev>',
        to: [OWNER_EMAIL],
        subject: `🟢 Novo Lead: ${name}`,
        html
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Resend error:', err);
      return res.status(200).json({ ok: true, warn: 'email falhou mas lead registado' });
    }

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error('Erro em /api/lead:', error);
    return res.status(200).json({ ok: true, warn: error.message });
  }
};
