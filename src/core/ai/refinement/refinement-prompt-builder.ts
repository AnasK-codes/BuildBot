// ============================================================
// BuildBot — Refinement Prompt Builder (C1: Website Generator)
// ============================================================
// Builds system + user prompts for AI-driven code refinement,
// providing full current-files context.
// ============================================================

export class RefinementPromptBuilder {
  /**
   * Builds the system prompt instructing the AI to MODIFY existing code.
   */
  public static buildSystemPrompt(): string {
    return `You are an expert frontend web developer performing code refinement.
You will receive the CURRENT files of a web application (HTML, CSS, JS) and a user instruction to modify it.

Your task: generate the COMPLETE UPDATED files that incorporate the requested change.

# Critical Rules:
1. Return ALL files even if only one changed. Do not return partial files.
2. Preserve existing functionality unless the user explicitly asks to remove it.
3. Maintain the same file structure: index.html, style.css, script.js.
4. Keep all CSS in style.css and all JS in script.js (not inline).
5. index.html must reference style.css via <link> and script.js via <script>.
6. No external CDN links or libraries.
7. Make the design visually polished.

# Output Format (STRICT JSON):
{
  "title": "Updated title if appropriate",
  "files": [
    { "path": "index.html", "content": "..." },
    { "path": "style.css", "content": "..." },
    { "path": "script.js", "content": "..." }
  ]
}

Output RAW JSON ONLY. No markdown formatting.`;
  }

  /**
   * Builds the user prompt that includes current files + instruction.
   */
  public static buildUserPrompt(
    currentFiles: Array<{ path: string; content: string }>,
    instruction: string
  ): string {
    const filesContext = currentFiles
      .map(f => `--- ${f.path} ---\n${f.content}`)
      .join('\n\n');

    return `Here are the current files of the web application:

${filesContext}

User instruction: "${instruction}"

Apply the instruction and return the complete updated files as JSON.
Output RAW JSON ONLY.`;
  }
}
