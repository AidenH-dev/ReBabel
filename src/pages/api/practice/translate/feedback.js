import { withAuth } from '@/lib/withAuth';
import { submitFeedback } from '@/lib/langsmith';
import { createRateLimiter } from '@/lib/rateLimit';

const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 30 });

async function handler(req, res) {
  if (!limiter.check(req.auth0Sub)) {
    return res
      .status(429)
      .json({ error: 'Too many requests. Please try again later.' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { runId, feedbackType, context, sentenceIndex, sentenceContent } =
    req.body;
  // feedbackType: 'good' | 'bad' | 'incorrect'
  // context: 'generation' | 'grading'
  // sentenceIndex: (optional) which sentence in the batch
  // sentenceContent: (optional) the sentence text

  if (!runId || !feedbackType) {
    return res.status(400).json({ error: 'Missing runId or feedbackType' });
  }

  const scoreMap = { good: 1, bad: 0, incorrect: -1 };
  const score = scoreMap[feedbackType] ?? 0;

  // Build comment with sentence details for generation feedback
  let comment = `User feedback: ${feedbackType}`;
  if (context === 'generation' && sentenceIndex !== undefined) {
    comment = `[Sentence ${sentenceIndex + 1}] ${feedbackType}: "${sentenceContent || 'N/A'}"`;
  }

  try {
    const result = await submitFeedback(runId, `${context}-quality`, {
      score,
      comment,
    });

    return res.status(200).json({ success: result.success });
  } catch (error) {
    req.log.error('feedback.submission_failed', {
      error: error?.message || String(error),
      stack: error?.stack,
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to submit feedback',
    });
  }
}

export default withAuth(handler);
