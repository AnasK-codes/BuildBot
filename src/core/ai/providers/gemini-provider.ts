import { GoogleGenerativeAI, Schema } from '@google/generative-ai';
import { AIProvider } from './ai-provider';
import { sanitizeJsonResponse } from '../utils/json-sanitizer';
import { createModuleLogger } from '@/lib/logger';

const log = createModuleLogger('gemini-provider');

export class GeminiProvider implements AIProvider {
  private genAI: GoogleGenerativeAI;
  // Use a default model, configurable via env
  private modelName = process.env.GEMINI_MODEL || 'gemini-1.5-pro';

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }

  private async generateJSON(systemPrompt: string, userPrompt: string, temperature = 0.2): Promise<string> {
    log.info('Calling Gemini for generation...');
    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        systemInstruction: systemPrompt,
        generationConfig: {
          temperature,
          responseMimeType: "application/json",
        },
      });

      const result = await model.generateContent(userPrompt);
      const content = result.response.text();
      
      if (!content) {
        throw new Error('No content returned from Gemini');
      }

      return sanitizeJsonResponse(content);
    } catch (error) {
      log.error({ err: error }, 'Gemini generation failed');
      throw new Error(`Gemini Provider failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async generateSchema(systemPrompt: string, userPrompt: string): Promise<string> {
    return this.generateJSON(systemPrompt, userPrompt, 0.2);
  }

  public async refineSchema(systemPrompt: string, userPrompt: string): Promise<string> {
    return this.generateJSON(systemPrompt, userPrompt, 0.2);
  }

  public async generateRepair(systemPrompt: string, userPrompt: string): Promise<string> {
    return this.generateJSON(systemPrompt, userPrompt, 0.1);
  }

  public async generateSeedData(systemPrompt: string, userPrompt: string): Promise<string> {
    return this.generateJSON(systemPrompt, userPrompt, 0.7);
  }
}
