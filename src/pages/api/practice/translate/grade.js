import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { tracedLLMCall } from '@/lib/langsmith';

export default withApiAuthRequired(async function handler(req, res) {
  const session = await getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    englishSentence, // Original English
    expectedTranslation, // Expected Japanese (from generation)
    userTranslation, // User's Japanese attempt
    focalPoint, // The focal point being practiced
    context, // Pools for reference
    provider = 'deepseek', // LLM provider
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
    },
  };

  const config = providers[provider] || providers.deepseek;
  if (!config.key) {
    return res
      .status(500)
      .json({ error: `API key not configured for provider: ${provider}` });
  }

  // Build grading prompt - PROPORTIONAL SCORING
  const systemInstructions = `You are a Japanese language grading system.

CATEGORIES (NO OVERLAP - never deduct same error twice):
1. Grammar (0-100%): Particles (は/が/を/に/で/へ/と/も/の/か/よ/ね), verb conjugation, tense, sentence structure
2. Vocabulary (0-100%): Word choices ONLY (nouns, verb stems, adjectives) - NOT particles

SCORING METHOD (PROPORTIONAL):
- First, COUNT the actual elements in the expected sentence
- Grammar score = (correct grammar elements / total grammar elements) × 100
- Vocabulary score = (correct vocabulary words / total vocabulary words) × 100

ELEMENT SCORING:
- Correct: 1 point
- Similar (synonym, related form): 0.5 points
- Wrong or missing: 0 points

CRITICAL - BEFORE SCORING:
1. List each expected element from the expected answer
2. Search for that EXACT element in the user's answer
3. Check character-by-character for kana (か vs が, は vs わ, つ vs っ)
4. Only mark wrong if element is CONFIRMED missing or wrong
5. If unsure, mark as correct

EXAMPLE 1:
Expected: わたしはりんごをたべますか
User: わたしがりんごをたべますか

Step 1 - Count elements:
- Grammar (4): は, を, ます, か
- Vocabulary (3): わたし, りんご, たべ

Step 2 - Score:
- Grammar: は=0 (wrong), を=1, ます=1, か=1 → 3/4 = 75%
- Vocabulary: all correct → 3/3 = 100%

Result: {"grades":{"grammar":75,"vocabulary":100},"errors":{"grammar":["Used が instead of は"]},"feedback":"Good vocabulary, watch topic particle"}

EXAMPLE 2:
Expected: いぬがいます
User: ねこがいます

Step 1 - Count elements:
- Grammar (2): が (particle), ます (polite conjugation)
- Vocabulary (2): いぬ (noun), い (verb stem of いる)

Step 2 - Score:
- Grammar: が=1, ます=1 → 2/2 = 100%
- Vocabulary: いぬ=0 (user said ねこ), い(ます)=1 → 1/2 = 50%

Result: {"grades":{"grammar":100,"vocabulary":50},"errors":{"vocabulary":["Used ねこ instead of いぬ"]},"feedback":"Verb correct but wrong noun"}

Return JSON only.`;

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
      { role: 'user', content: userMessage },
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
                vocabulary: { type: 'number' },
              },
              required: ['grammar', 'vocabulary'],
              additionalProperties: false,
            },
            errors: {
              type: 'object',
              properties: {
                grammar: { type: 'array', items: { type: 'string' } },
                vocabulary: { type: 'array', items: { type: 'string' } },
              },
              required: ['grammar', 'vocabulary'],
              additionalProperties: false,
            },
            feedback: { type: 'string' },
          },
          required: ['grades', 'errors', 'feedback'],
          additionalProperties: false,
        },
      },
    };
  } else if (provider === 'deepseek') {
    requestBody.response_format = { type: 'json_object' };
  }

  try {
    const result = await tracedLLMCall({
      name: 'grade-translation',
      provider,
      model: config.model,
      messages: requestBody.messages,
      metadata: {
        englishSentence,
        focalPointType: focalPoint?.type,
        userId: session.user.sub,
      },
      fetchFn: async () => {
        const response = await fetch(config.url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error(`${provider} API error:`, errorData);
          throw new Error(
            `${provider} API error: ${response.status} - ${JSON.stringify(errorData)}`
          );
        }

        const data = await response.json();

        // Log token usage
        if (data.usage) {
          console.log(`[GRADE - ${provider.toUpperCase()}] Token Usage:`, {
            model: data.model,
            prompt_tokens: data.usage.prompt_tokens,
            completion_tokens: data.usage.completion_tokens,
            total_tokens: data.usage.total_tokens,
          });
        }

        return {
          content: data.choices?.[0]?.message?.content,
          usage: data.usage,
        };
      },
    });

    const content = result.content;

    if (!content) {
      throw new Error(`No response from ${provider}`);
    }

    // Parse JSON response
    const parsed = JSON.parse(content);

    return res.status(200).json({
      success: true,
      data: parsed,
      runId: result.runId,
    });
  } catch (error) {
    console.error('Grading error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to grade translation',
      details: error.message,
    });
  }
});
