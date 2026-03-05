// api/deepseek.js - Versão ultra otimizada com cache e fallback

export default async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');

    // Timeout total reduzido para 8 segundos (sobra para resposta)
    const functionTimeout = setTimeout(() => {
        res.status(504).json({ 
            success: false, 
            error: 'A IA está demorando mais que o esperado. Por favor, tente novamente em alguns segundos.',
            retry: true
        });
    }, 8000);

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

        // Se o prompt for muito longo, avisa o usuário, mas processa mesmo assim
        const promptLength = prompt.length;
        const maxPromptLength = 2000;
        if (promptLength > maxPromptLength) {
            clearTimeout(functionTimeout);
            return res.status(400).json({ 
                success: false, 
                error: `Prompt muito longo (${promptLength} caracteres). Máximo recomendado: ${maxPromptLength}.`,
                retry: false
            });
        }

        const systemPrompt = `You are a specialized real estate AI assistant. Respond EXCLUSIVELY in ${language === 'pt' ? 'Portuguese' : 'English'}. Be practical and concise. Maximum 250 words.`;

        const controller = new AbortController();
        const apiTimeout = setTimeout(() => controller.abort(), 7000); // 7s para a API

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
                    max_tokens: 300,  // Ainda menor
                    top_p: 0.9,
                    frequency_penalty: 0.3,
                    presence_penalty: 0.3
                }),
                signal: controller.signal
            });

            clearTimeout(apiTimeout);

            const data = await response.json();

            if (!response.ok) {
                clearTimeout(functionTimeout);
                return res.status(response.status).json({
                    success: false,
                    error: data.error?.message || `Erro HTTP ${response.status}`,
                    retry: true
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
                    error: 'A API de IA demorou muito para responder. Tente novamente com um prompt menor ou mais simples.',
                    retry: true
                });
            }
            return res.status(500).json({ success: false, error: fetchError.message, retry: true });
        }
    } catch (error) {
        clearTimeout(functionTimeout);
        return res.status(500).json({ success: false, error: error.message, retry: true });
    }
}