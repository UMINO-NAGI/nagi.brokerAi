// api/deepseek.js
// Função serverless com controle de timeout e resposta otimizada

export default async function handler(req, res) {
    // Força cabeçalho JSON
    res.setHeader('Content-Type', 'application/json');

    // Timeout global da função (8 segundos para sobrar tempo para a resposta)
    const functionTimeout = setTimeout(() => {
        res.status(504).json({ 
            success: false, 
            error: 'Tempo limite da função excedido. Por favor, tente novamente com um prompt menor.' 
        });
    }, 8000);

    try {
        // Apenas POST
        if (req.method !== 'POST') {
            clearTimeout(functionTimeout);
            return res.status(405).json({ error: 'Método não permitido' });
        }

        const { prompt, language, tool } = req.body;
        if (!prompt) {
            clearTimeout(functionTimeout);
            return res.status(400).json({ error: 'Prompt é obrigatório' });
        }

        const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
        if (!DEEPSEEK_API_KEY) {
            clearTimeout(functionTimeout);
            return res.status(500).json({ error: 'Chave da API não configurada' });
        }

        // Prompt de sistema com idioma e instruções para respostas concisas
        const systemPrompt = `You are a specialized real estate AI assistant. ` +
            `Provide detailed, professional, and accurate responses for real estate agents. ` +
            `Respond EXCLUSIVELY in the language: ${language === 'pt' ? 'Portuguese' : 'English'}. ` +
            `Keep responses clear and structured. Maximum 500 words.`;

        // AbortController para timeout na chamada à API DeepSeek
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
                    max_tokens: 1000 // Reduzido para acelerar resposta
                }),
                signal: controller.signal
            });

            clearTimeout(apiTimeout); // Cancelar timeout da API

            const data = await response.json();

            if (!response.ok) {
                console.error('Erro da API DeepSeek:', data);
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
            console.error('Erro na chamada fetch:', fetchError);
            clearTimeout(functionTimeout);
            
            if (fetchError.name === 'AbortError') {
                return res.status(504).json({ 
                    success: false, 
                    error: 'A API demorou muito para responder. Tente novamente com um prompt menor.' 
                });
            }
            return res.status(500).json({ success: false, error: fetchError.message });
        }
    } catch (error) {
        console.error('Erro geral na função:', error);
        clearTimeout(functionTimeout);
        return res.status(500).json({ success: false, error: error.message });
    }
}