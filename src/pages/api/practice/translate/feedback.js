import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { submitFeedback } from '@/lib/langsmith';

export default withApiAuthRequired(async function handler(req, res) {
  const session = await getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({ error: 'Unauthorized' });
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
    console.error('Feedback submission error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to submit feedback',
    });
  }
});
