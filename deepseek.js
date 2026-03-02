// api/deepseek.js
export default async function handler(req, res) {
    // Garantir que a resposta seja sempre JSON
    res.setHeader('Content-Type', 'application/json');

    try {
        // Apenas POST permitido
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const { prompt, language, tool } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
        if (!DEEPSEEK_API_KEY) {
            console.error('DeepSeek API key não configurada');
            return res.status(500).json({ error: 'DeepSeek API key não configurada' });
        }

        // Monta o prompt de sistema com o idioma
        const systemPrompt = `You are a real estate AI assistant. Respond EXCLUSIVELY in the language: ${language === 'pt' ? 'Portuguese' : 'English'}. Provide helpful, professional, and concise answers.`;

        // Chama a API DeepSeek
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Erro da API DeepSeek:', data);
            throw new Error(data.error?.message || `Erro HTTP ${response.status}`);
        }

        const result = data.choices[0].message.content;
        return res.status(200).json({ success: true, result });

    } catch (error) {
        console.error('Erro na função deepseek:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}