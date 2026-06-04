// ============================================================
// BuildBot — AI Schema Generator
// ============================================================
// Handles integration with OpenAI to generate the JSON schema.
// ============================================================

import OpenAI from 'openai';
import { env } from '@/config/env';
import { createModuleLogger } from '@/lib/logger';

const log = createModuleLogger('schema-generator');

export class SchemaGenerator {
  private openai: OpenAI;

  constructor() {
    // We assume OPENAI_API_KEY is available in the environment.
    // In a real app, this should be validated in env.ts.
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate an AppDefinition JSON string using OpenAI.
   */
  public async generateJSON(systemPrompt: string, userPrompt: string): Promise<string> {
    log.info('Calling OpenAI for schema generation...');
    
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o', // or gpt-4-turbo
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2, // Low temperature for deterministic schema generation
      });

      const content = response.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content returned from OpenAI');
      }

      return content;
    } catch (error) {
      log.error({ err: error }, 'OpenAI generation failed');
      throw new Error(`AI Generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
