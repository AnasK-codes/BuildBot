export interface AIProvider {
  /**
   * Generates a new AppDefinition JSON string from scratch based on prompts.
   */
  generateSchema(systemPrompt: string, userPrompt: string): Promise<string>;

  /**
   * Refines an existing AppDefinition JSON string based on user instructions.
   */
  refineSchema(systemPrompt: string, userPrompt: string): Promise<string>;

  /**
   * Attempts to repair an invalid JSON schema using AI.
   */
  generateRepair(systemPrompt: string, userPrompt: string): Promise<string>;

  /**
   * Generates sample data records for a given entity schema.
   */
  generateSeedData(systemPrompt: string, userPrompt: string): Promise<string>;
}
