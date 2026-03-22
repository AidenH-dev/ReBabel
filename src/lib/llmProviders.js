/**
 * LLM provider configuration.
 * Single source of truth for provider URLs, API keys, and default models.
 */

export const LLM_PROVIDERS = {
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

export const DEFAULT_PROVIDER = 'anthropic';

export function getProviderConfig(provider) {
  return LLM_PROVIDERS[provider] || LLM_PROVIDERS[DEFAULT_PROVIDER];
}
