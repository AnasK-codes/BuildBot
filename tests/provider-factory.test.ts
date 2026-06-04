import { ProviderFactory } from '@/core/ai/providers/provider-factory';
import { OpenAIProvider } from '@/core/ai/providers/openai-provider';
import { GroqProvider } from '@/core/ai/providers/groq-provider';
import { GeminiProvider } from '@/core/ai/providers/gemini-provider';

describe('ProviderFactory', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { 
      ...originalEnv, 
      OPENAI_API_KEY: 'test-key',
      GROQ_API_KEY: 'test-key',
      GEMINI_API_KEY: 'test-key'
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return OpenAIProvider by default', () => {
    delete process.env.AI_PROVIDER;
    const provider = ProviderFactory.getProvider();
    expect(provider).toBeInstanceOf(OpenAIProvider);
  });

  it('should return GroqProvider when configured', () => {
    process.env.AI_PROVIDER = 'groq';
    const provider = ProviderFactory.getProvider();
    expect(provider).toBeInstanceOf(GroqProvider);
  });

  it('should return GeminiProvider when configured', () => {
    process.env.AI_PROVIDER = 'gemini';
    const provider = ProviderFactory.getProvider();
    expect(provider).toBeInstanceOf(GeminiProvider);
  });

  it('should wrap in FallbackProviderWrapper when AI_FALLBACK_PROVIDER is set', async () => {
    process.env.AI_PROVIDER = 'openai';
    process.env.AI_FALLBACK_PROVIDER = 'groq';
    
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
