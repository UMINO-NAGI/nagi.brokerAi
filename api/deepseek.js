// api/deepseek.js
export default async function handler(req, res) {
    // Garantir resposta JSON sempre
    res.setHeader('Content-Type', 'application/json');

    try {
        // Apenas POST
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const { prompt, language, tool, systemPrompt: customSystemPrompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt é obrigatório' });
        }

        const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
        if (!DEEPSEEK_API_KEY) {
            console.error('❌ DeepSeek API key não configurada');
            return res.status(500).json({ error: 'Configuração da API inválida' });
        }

        // Usa o systemPrompt personalizado se fornecido, senão cria um genérico
        const systemPrompt = customSystemPrompt || 
            `You are a real estate AI assistant. Respond EXCLUSIVELY in ${language === 'pt' ? 'Portuguese' : 'English'}. Provide helpful, professional, and concise answers.`;

        console.log(`📤 Enviando para DeepSeek (ferramenta ${tool || 'genérica'})...`);

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
                max_tokens: 1500
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Erro da DeepSeek:', data);
            return res.status(response.status).json({ 
                success: false, 
                error: data.error?.message || `Erro HTTP ${response.status}` 
            });
        }

        const result = data.choices[0].message.content;
        console.log('✅ Resposta recebida da DeepSeek');
        return res.status(200).json({ success: true, result });

    } catch (error) {
        console.error('❌ Erro na função deepseek:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message || 'Erro interno do servidor' 
        });
    }
}