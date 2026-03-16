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
    provider = 'openai', // LLM provider
    analyticsSessionId, // Links trace to analytics session
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
    anthropic: {
      url: 'https://api.anthropic.com/v1/messages',
      key: process.env.CLAUDE_KEY,
      model: 'claude-haiku-4-5-20251001',
    },
  };

  const providerConfig = providers[provider] || providers.anthropic;
  if (!providerConfig.key) {
    return res
      .status(500)
      .json({ error: `API key not configured for provider: ${provider}` });
  }

  // Build system prompt (XML tags for Claude)
  const systemInstructions = `You are a Japanese language grading system. Grade the user's Japanese translation against the expected answer.

<scoring_rules>
Two independent categories — never penalize the same error in both:

Grammar (0–100%): particles (は/が/を/に/で/へ/と/も/の/か), verb conjugation, tense, sentence structure
Vocabulary (0–100%): word choices only (nouns, verb stems, adjectives) — NOT particles

Score = (points earned / total elements) × 100
  correct match → 1 point
  synonym or related form → 0.5 points
  wrong or missing → 0 points
</scoring_rules>

<grading_process>
1. List every grammar element in the expected answer
2. List every vocabulary element in the expected answer
3. For each element, search the user's answer character-by-character
4. Score each element — if unsure, mark as correct
5. Calculate grammar% and vocabulary% separately
6. Set confidence (0–100) reflecting how clear-cut this grading was
</grading_process>

<example>
Expected: わたしはりんごをたべますか
User: わたしがりんごをたべますか

Grammar elements: は を ます か → user has: が(✗) を(✓) ます(✓) か(✓) = 3/4 = 75%
Vocabulary elements: わたし りんご たべ → all correct = 3/3 = 100%
</example>`;

  const userMessage = `ENGLISH: ${englishSentence}
EXPECTED: ${expectedTranslation}
USER: ${userTranslation}
FOCAL: ${focalPoint.type === 'grammar' ? focalPoint.item.title : focalPoint.item.english}

Grade this translation.`;

  // Tool schema for structured output
  const gradeTool = {
    name: 'submit_grade',
    description: 'Submit the grading result for a Japanese translation',
    input_schema: {
      type: 'object',
      properties: {
        grades: {
          type: 'object',
          properties: {
            grammar: { type: 'number' },
            vocabulary: { type: 'number' },
          },
          required: ['grammar', 'vocabulary'],
        },
        errors: {
          type: 'object',
          properties: {
            grammar: { type: 'array', items: { type: 'string' } },
            vocabulary: { type: 'array', items: { type: 'string' } },
          },
          required: ['grammar', 'vocabulary'],
        },
        feedback: { type: 'string' },
        confidence: { type: 'number' },
      },
      required: ['grades', 'errors', 'feedback', 'confidence'],
    },
  };

  try {
    const result = await tracedLLMCall({
      name: 'grade-translation',
      provider,
      model: providerConfig.model,
      messages: [{ role: 'user', content: userMessage }],
      metadata: {
        englishSentence,
        focalPointType: focalPoint?.type,
        userId: session.user.sub,
        analyticsSessionId: analyticsSessionId || null,
      },
      fetchFn: async () => {
        if (provider === 'anthropic') {
          const requestBody = {
            model: providerConfig.model,
            max_tokens: 1024,
            system: [
              {
                type: 'text',
                text: systemInstructions,
                cache_control: { type: 'ephemeral' },
              },
            ],
            messages: [{ role: 'user', content: userMessage }],
            tools: [gradeTool],
            tool_choice: { type: 'tool', name: 'submit_grade' },
          };

          const response = await fetch(providerConfig.url, {
            method: 'POST',
            headers: {
              'x-api-key': providerConfig.key,
              'anthropic-version': '2023-06-01',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('anthropic API error:', errorData);
            throw new Error(
              `anthropic API error: ${response.status} - ${JSON.stringify(errorData)}`
            );
          }

          const data = await response.json();

          if (data.usage) {
            console.log('[GRADE - ANTHROPIC] Token Usage:', {
              model: data.model,
              input_tokens: data.usage.input_tokens,
              output_tokens: data.usage.output_tokens,
              cache_read_input_tokens: data.usage.cache_read_input_tokens,
            });
          }

          const toolBlock = data.content.find((b) => b.type === 'tool_use');
          return {
            content: JSON.stringify(toolBlock.input),
            usage: data.usage,
          };
        } else {
          // OpenAI / DeepSeek path
          const requestBody = {
            model: providerConfig.model,
            messages: [
              { role: 'system', content: systemInstructions },
              { role: 'user', content: userMessage },
            ],
          };

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
                        vocabulary: {
                          type: 'array',
                          items: { type: 'string' },
                        },
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

          const fetchResponse = await fetch(providerConfig.url, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${providerConfig.key}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          if (!fetchResponse.ok) {
            const errorData = await fetchResponse.json();
            console.error(`${provider} API error:`, errorData);
            throw new Error(
              `${provider} API error: ${fetchResponse.status} - ${JSON.stringify(errorData)}`
            );
          }

          const data = await fetchResponse.json();

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
        }
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
