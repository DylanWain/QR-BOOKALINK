export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'API key not configured' });

  try {
    const { prompt, contactName } = req.body;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const tomorrow = new Date(today.getTime() + 86400000).toISOString().split('T')[0];
    const nextWeek = new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0];
    const twoWeeks = new Date(today.getTime() + 14 * 86400000).toISOString().split('T')[0];

    const fullPrompt = `You are an AI assistant analyzing a voice note about a contact named "${contactName}". 
Today's date is ${todayStr}.

Voice note transcript:
"${prompt}"

Analyze and extract:
1. Key Information: Important facts about this person
2. Action Items & Reminders: Convert relative dates ("tomorrow" = ${tomorrow}, "next week" = ${nextWeek}, "in 2 weeks" = ${twoWeeks})
3. Relationship Context

Respond ONLY with valid JSON, no markdown:
{
  "summary": "Concise 1-2 sentence summary",
  "keyFacts": ["fact1", "fact2"],
  "reminders": [{"note": "What to do", "date": "YYYY-MM-DD", "time": "HH:MM or null", "type": "notification"}],
  "suggestedFollowUp": "Optional suggestion"
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: fullPrompt }]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ error: error.error?.message || 'API error' });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '{}';
    const cleaned = text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(cleaned);
    return res.status(200).json(result);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
