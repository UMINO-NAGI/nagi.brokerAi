// api/deepseek.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt, language, tool } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY; // Set in Vercel environment
    if (!DEEPSEEK_API_KEY) {
        return res.status(500).json({ error: 'DeepSeek API key not configured' });
    }

    // System prompt with language instruction
    const systemPrompt = `You are a real estate AI assistant. Respond EXCLUSIVELY in the language: ${language === 'pt' ? 'Portuguese' : 'English'}. Provide helpful, professional, and concise answers.`;

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
                max_tokens: 1000
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error?.message || 'DeepSeek API error');
        }

        const result = data.choices[0].message.content;
        res.status(200).json({ success: true, result });
    } catch (error) {
        console.error('DeepSeek API error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}