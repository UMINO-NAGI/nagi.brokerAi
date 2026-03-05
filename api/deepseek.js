// api/deepseek.js - Versão com timeout controlado e resposta rápida

export default async function handler(req, res) {
    // Garantir resposta JSON
    res.setHeader('Content-Type', 'application/json');

    // Timeout total da função (9 segundos para sobrar margem)
    const functionTimeout = setTimeout(() => {
        res.status(504).json({ 
            success: false, 
            error: 'Tempo limite excedido. A IA demorou muito para responder. Tente novamente com um prompt mais curto.' 
        });
    }, 9000);

    try {
        if (req.method !== 'POST') {
            clearTimeout(functionTimeout);
            return res.status(405).json({ error: 'Método não permitido' });
        }

        const { prompt, language } = req.body;
        if (!prompt) {
            clearTimeout(functionTimeout);
            return res.status(400).json({ error: 'Prompt é obrigatório' });
        }

        const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
        if (!DEEPSEEK_API_KEY) {
            clearTimeout(functionTimeout);
            return res.status(500).json({ error: 'Chave da API não configurada' });
        }

        // Prompt de sistema conciso e direto
        const systemPrompt = `You are a real estate AI assistant. Respond EXCLUSIVELY in ${language === 'pt' ? 'Portuguese' : 'English'}. Be practical and concise. Maximum 300 words.`;

        // Timeout para a chamada externa (7 segundos)
        const controller = new AbortController();
        const apiTimeout = setTimeout(() => controller.abort(), 7000);

        try {
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
                    max_tokens: 500,  // Limite reduzido para acelerar
                    top_p: 0.9
                }),
                signal: controller.signal
            });

            clearTimeout(apiTimeout);

            const data = await response.json();

            if (!response.ok) {
                clearTimeout(functionTimeout);
                return res.status(response.status).json({
                    success: false,
                    error: data.error?.message || `Erro HTTP ${response.status}`
                });
            }

            const result = data.choices[0].message.content;
            clearTimeout(functionTimeout);
            return res.status(200).json({ success: true, result });

        } catch (fetchError) {
            clearTimeout(apiTimeout);
            clearTimeout(functionTimeout);

            if (fetchError.name === 'AbortError') {
                return res.status(504).json({ 
                    success: false, 
                    error: 'A API de IA demorou muito para responder. Tente novamente com um prompt menor.' 
                });
            }
            return res.status(500).json({ success: false, error: fetchError.message });
        }
    } catch (error) {
        clearTimeout(functionTimeout);
        return res.status(500).json({ success: false, error: error.message });
    }
}