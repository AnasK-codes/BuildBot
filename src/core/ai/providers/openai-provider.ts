import OpenAI from 'openai';
import { AIProvider } from './ai-provider';
import { sanitizeJsonResponse } from '../utils/json-sanitizer';
import { createModuleLogger } from '@/lib/logger';

const log = createModuleLogger('openai-provider');

export class OpenAIProvider implements AIProvider {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  private async generateJSON(systemPrompt: string, userPrompt: string, temperature = 0.2): Promise<string> {
    log.info('Calling OpenAI for generation...');
    try {
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content returned from OpenAI');
      }

      return sanitizeJsonResponse(content);
    } catch (error) {
      log.error({ err: error }, 'OpenAI generation failed');
      throw new Error(`OpenAI Provider failed: ${error instanceof Error ? error.message : String(error)}`);
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
    return this.generateJSON(systemPrompt, userPrompt, 0.7); // Higher temp for creative data
  }
}
