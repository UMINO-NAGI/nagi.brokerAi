// api/deepseek.js
export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Responder preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Apenas POST permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { prompt, language } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt é obrigatório' });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.error('DEEPSEEK_API_KEY não configurada');
      return res.status(500).json({ error: 'Chave da API não configurada' });
    }

    const systemPrompt = language === 'pt' 
      ? 'Você é um assistente especializado em marketing imobiliário e vendas. Responda SEMPRE em português de forma profissional, persuasiva e detalhada.'
      : 'You are a real estate marketing and sales expert. Answer ALWAYS in English, professionally, persuasively and in detail.';

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 2000
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erro da DeepSeek:', data);
      return res.status(response.status).json({ 
        error: `Erro da API: ${data.error?.message || 'Desconhecido'}` 
      });
    }

    const result = data.choices[0].message.content;
    return res.status(200).json({ success: true, result });

  } catch (error) {
    console.error('Erro interno:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor. Tente novamente.' 
    });
  }
}