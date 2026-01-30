import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';

export default withApiAuthRequired(async function handler(req, res) {
  const session = await getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { grammarPool, vocabPool, focalPoints, count = 10, provider = 'deepseek' } = req.body;

  // Validate inputs
  if (!grammarPool || !vocabPool || !focalPoints || !Array.isArray(focalPoints)) {
    return res.status(400).json({ error: 'Missing required fields: grammarPool, vocabPool, focalPoints (array)' });
  }

  // Provider configuration
  const providers = {
    openai: {
      url: 'https://api.openai.com/v1/chat/completions',
      key: process.env.OPENAI_KEY,
      model: 'gpt-4o-mini',
    },
    deepseek: {
      url: 'https://api.deepseek.com/v1/chat/completions',
      key: process.env.DEEPSEEK_KEY,
      model: 'deepseek-chat',
    }
  };

  const config = providers[provider] || providers.openai;
  if (!config.key) {
    return res.status(500).json({ error: `API key not configured for provider: ${provider}` });
  }

  // Randomly select subset of pools to reduce token usage
  const MAX_VOCAB = 20;
  const MAX_GRAMMAR = 15;

  const shuffleArray = (arr) => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const trimmedVocabPool = shuffleArray(vocabPool).slice(0, MAX_VOCAB);
  const trimmedGrammarPool = shuffleArray(grammarPool).slice(0, MAX_GRAMMAR);

  // Separate focal points by type
  const grammarFocalPoints = focalPoints.filter(fp => fp.type === 'grammar');
  const vocabFocalPoints = focalPoints.filter(fp => fp.type === 'vocabulary' || fp.type === 'vocab');

  // Build system prompt for batch generation
  const systemInstructions = `
You are a Japanese language tutor creating translation practice sentences.

FOCAL GRAMMAR (MUST use at least 1 per sentence):
${grammarFocalPoints.map((fp, i) =>
  `${i + 1}. ${fp.item.title} - ${fp.item.description}`
).join('\n') || 'None specified'}

FOCAL VOCABULARY (MUST use at least 1 per sentence):
${vocabFocalPoints.map((fp, i) =>
  `${i + 1}. ${fp.item.english} (${fp.item.kana})`
).join('\n') || 'None specified'}

AVAILABLE VOCABULARY POOL:
${JSON.stringify(trimmedVocabPool.map(v => ({ english: v.english, kana: v.kana })))}

AVAILABLE GRAMMAR POOL:
${JSON.stringify(trimmedGrammarPool.map(g => ({ title: g.title, description: g.description })))}

STRICT REQUIREMENTS:
1. Generate exactly ${count} UNIQUE practice sentences
2. **MANDATORY**: Each sentence MUST contain at least 1 vocabulary word from the FOCAL VOCABULARY list above
3. **MANDATORY**: Each sentence MUST use at least 1 grammar pattern from the FOCAL GRAMMAR list above
4. **PROHIBITION**: No single vocabulary word may be used more than 2 times across ALL sentences - track and rotate vocabulary usage
5. Rotate through focal points to ensure variety and balanced coverage
6. Use additional vocabulary and grammar from the available pools as needed
7. Provide Japanese translations using ONLY hiragana and katakana (NO KANJI)
8. Keep sentences practical, natural, and appropriate for learners
9. CRITICAL: All ${count} sentences must be DIFFERENT from each other - no duplicates or near-duplicates
10. For each sentence, specify which focal point index (0-based) it primarily targets
`;

  // DeepSeek needs JSON format specified in prompt since it doesn't support json_schema
  const userMessageWithFormat = provider === 'deepseek'
    ? `Generate ${count} unique practice sentences using the focal points provided.

Return JSON in this exact format:
{"sentences": [{"english_sentence": "...", "expected_japanese_translation": "...", "focal_point_index": 0}, ...]}`
    : `Generate ${count} unique practice sentences using the focal points provided.`;

  // Build request body - OpenAI uses json_schema, DeepSeek uses json_object
  const requestBody = {
    model: config.model,
    messages: [
      { role: 'system', content: systemInstructions },
      { role: 'user', content: userMessageWithFormat }
    ],
  };

  // Add response format based on provider
  if (provider === 'openai') {
    requestBody.response_format = {
      type: 'json_schema',
      json_schema: {
        name: 'batch_translation_generation',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            sentences: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  english_sentence: { type: 'string' },
                  expected_japanese_translation: { type: 'string' },
                  focal_point_index: { type: 'number' }
                },
                required: ['english_sentence', 'expected_japanese_translation', 'focal_point_index'],
                additionalProperties: false
              }
            }
          },
          required: ['sentences'],
          additionalProperties: false
        }
      }
    };
  } else if (provider === 'deepseek') {
    requestBody.response_format = { type: 'json_object' };
  }

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`${provider} API error:`, errorData);
      throw new Error(`${provider} API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    // Log token usage
    if (data.usage) {
      console.log(`[GENERATE BATCH - ${provider.toUpperCase()}] Token Usage:`, {
        model: data.model,
        prompt_tokens: data.usage.prompt_tokens,
        completion_tokens: data.usage.completion_tokens,
        total_tokens: data.usage.total_tokens,
        sentences_generated: count
      });
    }

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error(`No response from ${provider}`);
    }

    // Parse JSON response
    const result = JSON.parse(content);

    // Map focal points back to sentences
    const sentencesWithFocalPoints = result.sentences.map(s => ({
      english: s.english_sentence,
      expectedJapanese: s.expected_japanese_translation,
      focalPoint: focalPoints[s.focal_point_index] || focalPoints[0]
    }));

    return res.status(200).json({
      success: true,
      data: {
        sentences: sentencesWithFocalPoints,
        count: sentencesWithFocalPoints.length
      }
    });

  } catch (error) {
    console.error('Generation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate sentences',
      details: error.message
    });
  }
});
