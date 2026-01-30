import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';

export default withApiAuthRequired(async function handler(req, res) {
  const session = await getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    englishSentence,           // Original English
    expectedTranslation,       // Expected Japanese (from generation)
    userTranslation,           // User's Japanese attempt
    focalPoint,                // The focal point being practiced
    context,                   // Pools for reference
    provider = 'deepseek'      // LLM provider
  } = req.body;

  // Validate inputs
  if (!englishSentence || !expectedTranslation || !userTranslation) {
    return res.status(400).json({ error: 'Missing required fields' });
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

  const config = providers[provider] || providers.deepseek;
  if (!config.key) {
    return res.status(500).json({ error: `API key not configured for provider: ${provider}` });
  }

  // Build grading prompt - 2-CATEGORY PERCENTAGE APPROACH
  const systemInstructions = `You are a Japanese language grading system. Grade on TWO categories only, each 0-100%.

CATEGORIES:
1. Grammar & Structure (0-100%): Particles, verb conjugation, tense, sentence structure, word order
2. Vocabulary (0-100%): Correct word choices, missing/wrong vocabulary, word forms

SCORING GUIDE:
- 100%: Perfect or near-perfect match
- 90-99%: Minor errors (small particle mistake, typo)
- 70-89%: PASSING - Conveys same ideas but not all expected words/grammar
- 60-69%: Close but missing information or mishandled grammar
- 40-59%: Partial understanding, significant errors
- 20-39%: Major issues, barely recognizable intent
- 0-19%: Nothing in common with expected sentence

DEDUCTION RULES:
- Wrong element: Full deduction
- Adjacent/similar element (synonym, related grammar): HALF deduction
- Missing element: Full deduction

Return JSON: {"grades":{"grammar":85,"vocabulary":90},"errors":{"grammar":["Used が instead of は (-10%)"],"vocabulary":["Used 食べる instead of いただく (-5%)"]},"feedback":"Brief summary"}`;

  const userMessage = `ENGLISH: ${englishSentence}
EXPECTED: ${expectedTranslation}
USER: ${userTranslation}
FOCAL: ${focalPoint.type === 'grammar' ? focalPoint.item.title : focalPoint.item.english}

Grade this translation.`;

  // Build request body
  const requestBody = {
    model: config.model,
    messages: [
      { role: 'system', content: systemInstructions },
      { role: 'user', content: userMessage }
    ],
  };

  // Add response format based on provider
  if (provider === 'openai') {
    requestBody.response_format = {
      type: 'json_schema',
      json_schema: {
        name: 'translation_grading',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            grades: {
              type: 'object',
              properties: {
                grammar: { type: 'number' },
                vocabulary: { type: 'number' }
              },
              required: ['grammar', 'vocabulary'],
              additionalProperties: false
            },
            errors: {
              type: 'object',
              properties: {
                grammar: { type: 'array', items: { type: 'string' } },
                vocabulary: { type: 'array', items: { type: 'string' } }
              },
              required: ['grammar', 'vocabulary'],
              additionalProperties: false
            },
            feedback: { type: 'string' }
          },
          required: ['grades', 'errors', 'feedback'],
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
      console.log(`[GRADE - ${provider.toUpperCase()}] Token Usage:`, {
        model: data.model,
        prompt_tokens: data.usage.prompt_tokens,
        completion_tokens: data.usage.completion_tokens,
        total_tokens: data.usage.total_tokens
      });
    }

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error(`No response from ${provider}`);
    }

    // Parse JSON response
    const result = JSON.parse(content);

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Grading error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to grade translation',
      details: error.message
    });
  }
});
