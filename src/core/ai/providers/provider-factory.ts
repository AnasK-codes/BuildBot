import { AIProvider } from './ai-provider';
import { OpenAIProvider } from './openai-provider';
import { GroqProvider } from './groq-provider';
import { GeminiProvider } from './gemini-provider';
import { createModuleLogger } from '@/lib/logger';

const log = createModuleLogger('provider-factory');

/**
 * Wraps an AIProvider to seamlessly fallback to a secondary provider if the primary fails.
 */
class FallbackProviderWrapper implements AIProvider {
  constructor(private primary: AIProvider, private fallback: AIProvider) {}

  private async executeWithFallback(
    operation: string,
    primaryFn: () => Promise<string>,
    fallbackFn: () => Promise<string>
  ): Promise<string> {
    try {
      return await primaryFn();
    } catch (error) {
      log.warn({ err: error, operation }, `Primary provider failed. Switching to fallback provider...`);
      return await fallbackFn();
    }
  }

  generateSchema(systemPrompt: string, userPrompt: string): Promise<string> {
    return this.executeWithFallback(
      'generateSchema',
      () => this.primary.generateSchema(systemPrompt, userPrompt),
      () => this.fallback.generateSchema(systemPrompt, userPrompt)
    );
  }

  refineSchema(systemPrompt: string, userPrompt: string): Promise<string> {
    return this.executeWithFallback(
      'refineSchema',
      () => this.primary.refineSchema(systemPrompt, userPrompt),
      () => this.fallback.refineSchema(systemPrompt, userPrompt)
    );
  }

  generateRepair(systemPrompt: string, userPrompt: string): Promise<string> {
    return this.executeWithFallback(
      'generateRepair',
      () => this.primary.generateRepair(systemPrompt, userPrompt),
      () => this.fallback.generateRepair(systemPrompt, userPrompt)
    );
  }

  generateSeedData(systemPrompt: string, userPrompt: string): Promise<string> {
    return this.executeWithFallback(
      'generateSeedData',
      () => this.primary.generateSeedData(systemPrompt, userPrompt),
      () => this.fallback.generateSeedData(systemPrompt, userPrompt)
    );
  }
}

export class ProviderFactory {
  private static createProvider(providerName: string): AIProvider {
    switch (providerName.toLowerCase()) {
      case 'openai':
        return new OpenAIProvider();
      case 'groq':
        return new GroqProvider();
      case 'gemini':
        return new GeminiProvider();
      default:
        log.warn({ provider: providerName }, `Unknown provider specified. Falling back to OpenAI.`);
        return new OpenAIProvider();
    }
  }

  public static getProvider(): AIProvider {
    const primaryName = process.env.AI_PROVIDER || 'openai';
    const fallbackName = process.env.AI_FALLBACK_PROVIDER;

    const primaryProvider = this.createProvider(primaryName);

    if (fallbackName) {
      log.info({ primary: primaryName, fallback: fallbackName }, 'Initializing AI Provider with Fallback');
      const fallbackProvider = this.createProvider(fallbackName);
      return new FallbackProviderWrapper(primaryProvider, fallbackProvider);
    }

    log.info({ provider: primaryName }, 'Initializing AI Provider');
    return primaryProvider;
  }
}
