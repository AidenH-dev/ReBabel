import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { createRateLimiter } from '@/lib/rateLimit';
import { generateQuestions } from '@/lib/conjugation';
import { categorizeWord } from '@/lib/kuromoji-categorize';

const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 20 });

export default withApiAuthRequired(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Rate limit
  const ip =
    req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  if (!limiter.check(ip)) {
    return res
      .status(429)
      .json({
        error: "You're sending requests too quickly. Please wait a moment.",
      });
  }

  try {
    const {
      poolItems,
      selectedVerbForms,
      selectedAdjForms,
      count,
      randomMode,
    } = req.body;

    // Validate inputs
    if (!Array.isArray(poolItems) || poolItems.length === 0) {
      return res.status(400).json({ error: 'No pool items provided' });
    }

    if (
      !randomMode &&
      (!selectedVerbForms || selectedVerbForms.length === 0) &&
      (!selectedAdjForms || selectedAdjForms.length === 0)
    ) {
      return res.status(400).json({ error: 'No conjugation forms selected' });
    }

    const questionCount = Math.min(Math.max(count || 10, 1), 9999);

    // Re-verify and enrich items via kuromoji.
    // Items may have been miscategorized during auto-categorize (e.g. nouns tagged as verbs).
    // For verbs missing verb_group, also attempt to fill it in.
    const CONJUGATABLE = ['verb', 'i-adjective', 'na-adjective'];
    const enrichedItems = [];
    for (const item of poolItems) {
      if (item.lexical_category === 'verb' && !item.verb_group) {
        try {
          const result = await categorizeWord(item.kana, item.kanji);
          if (!result || !CONJUGATABLE.includes(result.lexical_category)) {
            // Kuromoji says this isn't actually a verb/adj -- skip it
            console.warn(
              `Skipping miscategorized item (kuromoji says ${result?.lexical_category}): ${item.kana}`
            );
            continue;
          }
          enrichedItems.push({
            ...item,
            lexical_category: result.lexical_category,
            verb_group: result.verb_group || item.verb_group,
          });
        } catch {
          console.warn(`Kuromoji categorization failed for: ${item.kana}`);
        }
      } else {
        enrichedItems.push(item);
      }
    }

    if (enrichedItems.length === 0) {
      return res
        .status(400)
        .json({
          error:
            'No valid items after processing. Could not determine verb groups.',
        });
    }

    const questions = generateQuestions(
      enrichedItems,
      selectedVerbForms,
      selectedAdjForms,
      questionCount,
      randomMode
    );

    if (questions.length === 0) {
      return res
        .status(400)
        .json({
          error:
            'No questions could be generated from the selected items and forms.',
        });
    }

    return res.status(200).json({
      success: true,
      data: {
        questions,
        count: questions.length,
      },
    });
  } catch (error) {
    console.error('Conjugation generate error:', error);
    return res
      .status(500)
      .json({ error: 'Failed to generate conjugation questions' });
  }
});
