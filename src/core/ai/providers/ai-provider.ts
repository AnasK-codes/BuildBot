export interface AIProvider {
  /**
   * Generates HTML/CSS/JS code from a user prompt.
   * Returns raw JSON string containing { title, files: [...] }
   */
  generateCode(systemPrompt: string, userPrompt: string): Promise<string>;

  /**
   * Refines existing code based on user instruction.
   * Receives current files + instruction, returns updated files.
   */
  refineCode(systemPrompt: string, userPrompt: string): Promise<string>;

  /**
   * Repairs code that failed validation.
   */
  repairCode(systemPrompt: string, userPrompt: string): Promise<string>;
}
