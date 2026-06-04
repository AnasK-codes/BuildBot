import Groq from 'groq-sdk';
import { AIProvider } from './ai-provider';
import { sanitizeJsonResponse } from '../utils/json-sanitizer';
import { createModuleLogger } from '@/lib/logger';

const log = createModuleLogger('groq-provider');

export class GroqProvider implements AIProvider {
  private groq: Groq;

  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  private async generateJSON(systemPrompt: string, userPrompt: string, temperature = 0.2): Promise<string> {
    log.info('Calling Groq for generation...');
    try {
      const response = await this.groq.chat.completions.create({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content returned from Groq');
      }

      return sanitizeJsonResponse(content);
    } catch (error) {
      log.error({ err: error }, 'Groq generation failed');
      throw new Error(`Groq Provider failed: ${error instanceof Error ? error.message : String(error)}`);
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
