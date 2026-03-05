// api/deepseek.js - Versão ultra rápida com fallback

export default async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');

    // Timeout total da função (8 segundos para sobrar margem)
    const functionTimeout = setTimeout(() => {
        res.status(504).json({ 
            success: false, 
            error: 'A IA está demorando mais que o esperado. Por favor, tente novamente em alguns segundos.' 
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

        // Se o prompt for muito longo, já avisamos
        if (prompt.length > 500) {
            clearTimeout(functionTimeout);
            return res.status(200).json({ 
                success: true, 
                result: language === 'pt' 
                    ? 'Seu prompt está muito longo. Para uma resposta mais rápida, tente resumir a descrição do imóvel em até 500 caracteres.'
                    : 'Your prompt is too long. For a faster response, try to summarize the property description in up to 500 characters.'
            });
        }

        // Prompt de sistema extremamente conciso
        const systemPrompt = `You are a real estate AI. Respond in ${language === 'pt' ? 'Portuguese' : 'English'}. Be brief. Max 100 words.`;

        // Timeout curto para a API (4 segundos)
        const controller = new AbortController();
        const apiTimeout = setTimeout(() => controller.abort(), 4000);

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
                    max_tokens: 150, // Respostas curtas
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
                // Fallback: resposta amigável em vez de erro
                return res.status(200).json({ 
                    success: true, 
                    result: language === 'pt'
                        ? 'A IA está processando muitos pedidos agora. Para não te deixar sem resposta, aqui vai uma dica rápida: tente descrever o imóvel de forma mais direta (ex: "apartamento 2 quartos, centro, reformado") e clique novamente.'
                        : 'The AI is currently busy. Here is a quick tip: try describing the property more directly (e.g., "2-bedroom apartment, downtown, renovated") and click again.'
                });
            }
            return res.status(500).json({ success: false, error: fetchError.message });
        }
    } catch (error) {
        clearTimeout(functionTimeout);
        return res.status(500).json({ success: false, error: error.message });
    }
}