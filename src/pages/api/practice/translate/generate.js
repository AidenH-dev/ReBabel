import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { tracedLLMCall } from '@/lib/langsmith';

export const config = {
  maxDuration: 60,
};

export default withApiAuthRequired(async function handler(req, res) {
  const session = await getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    grammarPool,
    vocabPool,
    focalPoints,
    count = 10,
    provider = 'anthropic',
  } = req.body;

  // Validate inputs
  if (
    !grammarPool ||
    !vocabPool ||
    !focalPoints ||
    !Array.isArray(focalPoints)
  ) {
    return res.status(400).json({
      error:
        'Missing required fields: grammarPool, vocabPool, focalPoints (array)',
    });
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
  const grammarFocalPoints = focalPoints.filter((fp) => fp.type === 'grammar');
  const vocabFocalPoints = focalPoints.filter(
    (fp) => fp.type === 'vocabulary' || fp.type === 'vocab'
  );

  const grammarFocalText =
    grammarFocalPoints
      .map(
        (fp, i) =>
          `${i + 1}. [id: ${fp.item.id}] ${fp.item.title} - ${fp.item.description}`
      )
      .join('\n') || 'None specified';

  const vocabFocalText =
    vocabFocalPoints
      .map(
        (fp, i) =>
          `${i + 1}. [id: ${fp.item.id}] ${fp.item.english} (${fp.item.kana})`
      )
      .join('\n') || 'None specified';

  // Build ID → item lookup maps for post-processing attribution
  const vocabById = Object.fromEntries(trimmedVocabPool.map((v) => [v.id, v]));
  const grammarById = Object.fromEntries(
    trimmedGrammarPool.map((g) => [g.id, g])
  );
  // Include focal point items in lookup maps (may not be in trimmed pools)
  focalPoints.forEach((fp) => {
    if (fp.type === 'grammar') grammarById[fp.item.id] = fp.item;
    else vocabById[fp.item.id] = fp.item;
  });

  const trimmedGrammarPoolText = JSON.stringify(
    trimmedGrammarPool.map((g) => ({
      id: g.id,
      title: g.title,
      description: g.description,
    }))
  );

  const trimmedVocabPoolText = JSON.stringify(
    trimmedVocabPool.map((v) => ({
      id: v.id,
      english: v.english,
      kana: v.kana,
    }))
  );

  // Build system prompt (XML tags for Claude)
  const systemInstructions = `You are a Japanese language tutor creating translation practice sentences for learners.

<focal_grammar>
MUST use at least 1 per sentence:
${grammarFocalText}
</focal_grammar>

<focal_vocabulary>
MUST use at least 1 per sentence:
${vocabFocalText}
</focal_vocabulary>

<available_grammar>
${trimmedGrammarPoolText}
</available_grammar>

<available_vocabulary>
${trimmedVocabPoolText}
</available_vocabulary>

<requirements>
1. Generate exactly ${count} UNIQUE practice sentences
2. Each sentence MUST use at least 1 item from focal_grammar
3. Each sentence MUST use at least 1 item from focal_vocabulary
4. No single vocabulary word may appear in more than 2 sentences total
5. Rotate through focal points for balanced coverage
6. Japanese translations use ONLY hiragana and katakana — no kanji
7. Sentences must be practical, natural, and appropriate for learners
8. All sentences must be distinct — no duplicates or near-duplicates
9. focal_point_index is 0-based and refers to the focalPoints array
10. In items_used, list the exact id values of every vocabulary and grammar item you used in each sentence (from the id fields in available_vocabulary and available_grammar, or focal_grammar and focal_vocabulary)
</requirements>`;

  const userMessage = `Generate ${count} practice sentences.`;

  // Tool schema for structured output
  const generateTool = {
    name: 'submit_sentences',
    description: 'Submit the generated practice sentences',
    input_schema: {
      type: 'object',
      properties: {
        sentences: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              english_sentence: { type: 'string' },
              expected_japanese_translation: { type: 'string' },
              focal_point_index: { type: 'number' },
              items_used: {
                type: 'object',
                description: 'IDs of pool items actually used in this sentence',
                properties: {
                  vocabulary_ids: { type: 'array', items: { type: 'string' } },
                  grammar_ids: { type: 'array', items: { type: 'string' } },
                },
                required: ['vocabulary_ids', 'grammar_ids'],
              },
            },
            required: [
              'english_sentence',
              'expected_japanese_translation',
              'focal_point_index',
              'items_used',
            ],
          },
        },
      },
      required: ['sentences'],
    },
  };

  try {
    const result = await tracedLLMCall({
      name: 'generate-sentences',
      provider,
      model: providerConfig.model,
      messages: [{ role: 'user', content: userMessage }],
      metadata: {
        focalPointCount: focalPoints.length,
        sentenceCount: count,
        userId: session.user.sub,
        poolVocabIds: trimmedVocabPool.map((v) => v.id),
        poolGrammarIds: trimmedGrammarPool.map((g) => g.id),
        focalVocabIds: vocabFocalPoints.map((fp) => fp.item.id),
        focalGrammarIds: grammarFocalPoints.map((fp) => fp.item.id),
      },
      fetchFn: async () => {
        let response;

        if (provider === 'anthropic') {
          const requestBody = {
            model: providerConfig.model,
            max_tokens: 2048,
            system: systemInstructions,
            messages: [{ role: 'user', content: userMessage }],
            tools: [generateTool],
            tool_choice: { type: 'tool', name: 'submit_sentences' },
          };

          response = await fetch(providerConfig.url, {
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
            console.log('[GENERATE BATCH - ANTHROPIC] Token Usage:', {
              model: data.model,
              input_tokens: data.usage.input_tokens,
              output_tokens: data.usage.output_tokens,
              cache_read_input_tokens: data.usage.cache_read_input_tokens,
              sentences_generated: count,
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
              {
                role: 'user',
                content:
                  provider === 'deepseek'
                    ? `Generate ${count} unique practice sentences using the focal points provided.\n\nReturn JSON in this exact format:\n{"sentences": [{"english_sentence": "...", "expected_japanese_translation": "...", "focal_point_index": 0, "items_used": {"vocabulary_ids": ["id1"], "grammar_ids": ["id2"]}}, ...]}`
                    : userMessage,
              },
            ],
          };

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
                          focal_point_index: { type: 'number' },
                          items_used: {
                            type: 'object',
                            properties: {
                              vocabulary_ids: {
                                type: 'array',
                                items: { type: 'string' },
                              },
                              grammar_ids: {
                                type: 'array',
                                items: { type: 'string' },
                              },
                            },
                            required: ['vocabulary_ids', 'grammar_ids'],
                            additionalProperties: false,
                          },
                        },
                        required: [
                          'english_sentence',
                          'expected_japanese_translation',
                          'focal_point_index',
                          'items_used',
                        ],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ['sentences'],
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
            console.log(
              `[GENERATE BATCH - ${provider.toUpperCase()}] Token Usage:`,
              {
                model: data.model,
                prompt_tokens: data.usage.prompt_tokens,
                completion_tokens: data.usage.completion_tokens,
                total_tokens: data.usage.total_tokens,
                sentences_generated: count,
              }
            );
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

    // Map focal points back to sentences and resolve item provenance
    const sentencesWithFocalPoints = parsed.sentences.map((s) => {
      const usedVocab = (s.items_used?.vocabulary_ids ?? [])
        .map((id) => vocabById[id])
        .filter(Boolean);
      const usedGrammar = (s.items_used?.grammar_ids ?? [])
        .map((id) => grammarById[id])
        .filter(Boolean);

      return {
        english: s.english_sentence,
        expectedJapanese: s.expected_japanese_translation,
        focalPoint: focalPoints[s.focal_point_index] || focalPoints[0],
        itemsUsed: {
          vocabulary: usedVocab,
          grammar: usedGrammar,
        },
      };
    });

    console.log(
      '[GENERATE BATCH - ITEM USAGE]',
      sentencesWithFocalPoints.map((s) => ({
        english: s.english,
        vocab: s.itemsUsed.vocabulary.map((v) => v.english),
        grammar: s.itemsUsed.grammar.map((g) => g.title),
      }))
    );

    return res.status(200).json({
      success: true,
      data: {
        sentences: sentencesWithFocalPoints,
        count: sentencesWithFocalPoints.length,
      },
      runId: result.runId,
    });
  } catch (error) {
    console.error('Generation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate sentences',
      details: error.message,
    });
  }
});
