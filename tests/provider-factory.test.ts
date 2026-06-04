import { ProviderFactory } from '@/core/ai/providers/provider-factory';
import { OpenAIProvider } from '@/core/ai/providers/openai-provider';
import { GroqProvider } from '@/core/ai/providers/groq-provider';
import { GeminiProvider } from '@/core/ai/providers/gemini-provider';
import { StartupError } from '@/core/ai/providers/provider-health';

jest.mock('@/config/env', () => ({
  env: {
    AI_PROVIDER: 'openai',
    OPENAI_API_KEY: 'test-key',
    GROQ_API_KEY: 'test-key',
    GEMINI_API_KEY: 'test-key',
  }
}));

import { env } from '@/config/env';

describe('ProviderFactory', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    ProviderFactory.reset(); // Reset singleton state
    process.env = { 
      ...originalEnv, 
      AI_PROVIDER: 'openai', // Default for tests
      OPENAI_API_KEY: 'test-key',
      GROQ_API_KEY: 'test-key',
      GEMINI_API_KEY: 'test-key'
    };
    
    // Mock the env object which is exported from env.ts
    // We modify it directly since in actual code it's evaluated once on startup.
    (env as any).AI_PROVIDER = 'openai';
    (env as any).AI_FALLBACK_PROVIDER = undefined;
    (env as any).OPENAI_API_KEY = 'test-key';
    (env as any).GROQ_API_KEY = 'test-key';
    (env as any).GEMINI_API_KEY = 'test-key';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return OpenAIProvider by default', () => {
    (env as any).AI_PROVIDER = 'openai';
    const provider = ProviderFactory.getProvider();
    expect(provider).toBeInstanceOf(OpenAIProvider);
  });

  it('should return GroqProvider when configured', () => {
    (env as any).AI_PROVIDER = 'groq';
    const provider = ProviderFactory.getProvider();
    expect(provider).toBeInstanceOf(GroqProvider);
  });

  it('should return GeminiProvider when configured', () => {
    (env as any).AI_PROVIDER = 'gemini';
    const provider = ProviderFactory.getProvider();
    expect(provider).toBeInstanceOf(GeminiProvider);
  });

  it('should return the exact same instance on subsequent calls (Singleton)', () => {
    (env as any).AI_PROVIDER = 'openai';
    const provider1 = ProviderFactory.getProvider();
    const provider2 = ProviderFactory.getProvider();
    expect(provider1).toBe(provider2);
  });

  it('should throw StartupError if primary and fallback are the same', () => {
    (env as any).AI_PROVIDER = 'openai';
    (env as any).AI_FALLBACK_PROVIDER = 'openai';

    expect(() => {
      ProviderFactory.getProvider();
    }).toThrow(StartupError);
  });

  it('should wrap in FallbackProviderWrapper when AI_FALLBACK_PROVIDER is set', async () => {
    (env as any).AI_PROVIDER = 'openai';
    (env as any).AI_FALLBACK_PROVIDER = 'groq';
    
    // We mock the generation to force a failure in primary, success in fallback
    const provider = ProviderFactory.getProvider();
    
    // Since it's an internal class, we just check its behavior or constructor name
    expect(provider.constructor.name).toBe('FallbackProviderWrapper');
    
    // Mock the inner providers manually to test fallback logic
    const mockPrimary = {
      generateSchema: jest.fn().mockRejectedValue(new Error('Rate limit exceeded'))
    };
    const mockFallback = {
      generateSchema: jest.fn().mockResolvedValue('{"status":"success from fallback"}')
    };

    // Override the wrapper's internal state via reflection for testing
    (provider as any).primary = mockPrimary;
    (provider as any).fallback = mockFallback;

    const result = await provider.generateSchema('system', 'user');
    
    expect(mockPrimary.generateSchema).toHaveBeenCalled();
    expect(mockFallback.generateSchema).toHaveBeenCalled();
    expect(result).toBe('{"status":"success from fallback"}');
  });
});
