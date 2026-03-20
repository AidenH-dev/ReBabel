import { Client } from 'langsmith';
import { randomUUID } from 'crypto';

const client = new Client();

function toUsageMetadata(usage = {}) {
  const inputTokens = usage.prompt_tokens ?? usage.input_tokens;
  const outputTokens = usage.completion_tokens ?? usage.output_tokens;
  const totalTokens =
    usage.total_tokens ??
    (typeof inputTokens === 'number' && typeof outputTokens === 'number'
      ? inputTokens + outputTokens
      : undefined);

  if (
    typeof inputTokens !== 'number' ||
    typeof outputTokens !== 'number' ||
    typeof totalTokens !== 'number'
  ) {
    return null;
  }

  const cachedInputTokens =
    usage.prompt_tokens_details?.cached_tokens ??
    usage.prompt_cache_hit_tokens ??
    usage.cache_read_input_tokens;

  const inputTokenDetails = {
    ...(typeof cachedInputTokens === 'number' && {
      cache_read: cachedInputTokens,
    }),
  };

  return {
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_tokens: totalTokens,
    ...(Object.keys(inputTokenDetails).length > 0 && {
      input_token_details: inputTokenDetails,
    }),
  };
}

/**
 * Wraps an LLM fetch call with LangSmith tracing
 * @param {Object} options
 * @param {string} options.name - Name for this trace (e.g., 'generate-sentences', 'grade-translation')
 * @param {string} options.provider - Provider name (e.g., 'openai', 'deepseek')
 * @param {string} options.model - Model name
 * @param {Array} options.messages - The messages array sent to the LLM
 * @param {Object} options.metadata - Additional metadata to log
 * @param {Function} options.fetchFn - Async function that performs the actual fetch
 * @returns {Promise<Object>} The parsed response data
 */
export async function tracedLLMCall({
  name,
  provider,
  model,
  messages,
  metadata = {},
  fetchFn,
}) {
  // Skip tracing if not configured (support both old LANGCHAIN_* and new LANGSMITH_* env vars)
  const apiKey = process.env.LANGSMITH_API_KEY || process.env.LANGCHAIN_API_KEY;
  const tracingEnabled =
    process.env.LANGSMITH_TRACING === 'true' ||
    process.env.LANGCHAIN_TRACING_V2 === 'true';
  const projectName =
    process.env.LANGSMITH_PROJECT || process.env.LANGCHAIN_PROJECT || 'default';

  if (!apiKey || !tracingEnabled) {
    const result = await fetchFn();
    return { ...result, runId: null };
  }

  const runId = randomUUID();
  const startTime = Date.now();

  const tags = [];
  if (metadata.analyticsSessionId)
    tags.push(`session:${metadata.analyticsSessionId}`);
  if (metadata.userId) tags.push(`user:${metadata.userId}`);

  try {
    // Create the run — tracing failures should not block the LLM call
    try {
      await client.createRun({
        id: runId,
        name,
        run_type: 'llm',
        inputs: { messages, provider, model, ...metadata },
        extra: {
          metadata: {
            ls_provider: provider,
            ls_model_name: model,
            ls_model_type: 'chat',
            ...(metadata.userId && {
              user_id: metadata.userId,
            }),
            ...(metadata.analyticsSessionId && {
              analytics_session_id: metadata.analyticsSessionId,
            }),
          },
        },
        ...(tags.length > 0 && { tags }),
        start_time: startTime,
        project_name: projectName,
      });
    } catch (traceError) {
      console.error(
        'LangSmith createRun failed (non-blocking):',
        traceError.message
      );
    }

    // Execute the actual LLM call
    const result = await fetchFn();
    const usageMetadata = toUsageMetadata(result.usage);

    // Update run with success — tracing failures should not block the response
    try {
      await client.updateRun(runId, {
        outputs: {
          content: result.content,
          usage: result.usage,
          ...(usageMetadata && {
            usage_metadata: usageMetadata,
          }),
        },
        ...(usageMetadata && {
          prompt_tokens: usageMetadata.input_tokens,
          completion_tokens: usageMetadata.output_tokens,
          total_tokens: usageMetadata.total_tokens,
        }),
        end_time: Date.now(),
      });
    } catch (traceError) {
      console.error(
        'LangSmith updateRun failed (non-blocking):',
        traceError.message
      );
    }

    return { ...result, runId };
  } catch (error) {
    // Update run with error — best-effort, don't mask the original error
    try {
      await client.updateRun(runId, {
        error: error.message,
        end_time: Date.now(),
      });
    } catch (traceError) {
      console.error(
        'LangSmith error updateRun failed (non-blocking):',
        traceError.message
      );
    }
    throw error;
  }
}

/**
 * Simple wrapper for tracing any operation (not just LLM calls)
 */
export async function traced(name, metadata, fn) {
  const apiKey = process.env.LANGSMITH_API_KEY || process.env.LANGCHAIN_API_KEY;
  const tracingEnabled =
    process.env.LANGSMITH_TRACING === 'true' ||
    process.env.LANGCHAIN_TRACING_V2 === 'true';
  const projectName =
    process.env.LANGSMITH_PROJECT || process.env.LANGCHAIN_PROJECT || 'default';

  if (!apiKey || !tracingEnabled) {
    return fn();
  }

  const runId = randomUUID();

  try {
    try {
      await client.createRun({
        id: runId,
        name,
        run_type: 'chain',
        inputs: metadata,
        start_time: Date.now(),
        project_name: projectName,
      });
    } catch (traceError) {
      console.error(
        'LangSmith createRun failed (non-blocking):',
        traceError.message
      );
    }

    const result = await fn();

    try {
      await client.updateRun(runId, {
        outputs: { result },
        end_time: Date.now(),
      });
    } catch (traceError) {
      console.error(
        'LangSmith updateRun failed (non-blocking):',
        traceError.message
      );
    }

    return result;
  } catch (error) {
    try {
      await client.updateRun(runId, {
        error: error.message,
        end_time: Date.now(),
      });
    } catch (traceError) {
      console.error(
        'LangSmith error updateRun failed (non-blocking):',
        traceError.message
      );
    }
    throw error;
  }
}

/**
 * Submits user feedback to LangSmith for a specific run
 * @param {string} runId - The LangSmith run ID
 * @param {string} key - Feedback key (e.g., 'generation-quality', 'grading-quality')
 * @param {Object} options - Feedback options
 * @param {number} options.score - Score value (1 for good, 0 for bad, -1 for incorrect)
 * @param {string} options.comment - Optional comment
 */
export async function submitFeedback(runId, key, { score, comment = '' }) {
  const apiKey = process.env.LANGSMITH_API_KEY || process.env.LANGCHAIN_API_KEY;
  if (!apiKey || !runId) {
    return { success: false };
  }

  try {
    await client.createFeedback(runId, key, { score, comment });
    return { success: true };
  } catch (error) {
    console.error('LangSmith feedback error:', error);
    return { success: false };
  }
}
