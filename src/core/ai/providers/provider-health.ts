import { env } from '@/config/env';
import { createModuleLogger } from '@/lib/logger';

const log = createModuleLogger('provider-health');

export class StartupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StartupError';
  }
}

/**
 * Validates the currently selected AI Provider and Fallback Provider configurations.
 * Expected to be called when the ProviderFactory initializes the singleton.
 */
export function validateProviderConfiguration() {
  log.info('Validating AI Provider configurations...');

  const primary = env.AI_PROVIDER;
  const fallback = env.AI_FALLBACK_PROVIDER;

  log.info({ primary, fallback }, 'Current AI routing configuration');

  if (primary === fallback) {
    throw new StartupError('AI_PROVIDER and AI_FALLBACK_PROVIDER cannot be the same. Please choose a different fallback provider.');
  }

  // Model names verification
  const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o';
  const groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  const geminiModel = process.env.GEMINI_MODEL || 'gemini-1.5-pro';

  log.debug({
    models: {
      openai: openaiModel,
      groq: groqModel,
      gemini: geminiModel,
    }
  }, 'Loaded AI Models');

  log.info('Provider health check passed.');
}
