// ============================================================
// BuildBot — Web Prompt Builder
// ============================================================
// Constructs system and user prompts for HTML/CSS/JS website
// generation. Replaces the old CRUD-oriented PromptBuilder.
// ============================================================

import { CodeValidationError } from '@/types/project.types';

export class WebPromptBuilder {
  /**
   * System prompt that instructs the AI to generate web apps.
   */
  public static buildSystemPrompt(): string {
    return `You are an expert frontend web developer.
Your task is to generate a complete, working web application using ONLY:
- HTML5
- CSS3
- Vanilla JavaScript (ES6+)

# Output Format (STRICT JSON):
{
  "title": "Human-readable project title",
  "files": [
    { "path": "index.html", "content": "<!DOCTYPE html>..." },
    { "path": "style.css", "content": "body { ... }" },
    { "path": "script.js", "content": "// ..." }
  ]
}

# Rules:
1. Always output exactly 3 files: index.html, style.css, script.js.
2. The index.html MUST link to style.css via <link rel="stylesheet" href="style.css"> in the <head>.
3. The index.html MUST include <script src="script.js"></script> before </body>.
4. The app must be FULLY FUNCTIONAL — not a placeholder, skeleton, or "coming soon" page.
5. Use modern CSS: flexbox, grid, custom properties (--variables), smooth transitions, animations.
6. Use modern JS: const/let, arrow functions, template literals, DOM APIs, event delegation.
7. Make the design visually polished — use thoughtful colors, spacing, typography, and hover effects.
8. All logic must be self-contained. No external CDN links, no libraries, no frameworks.
9. DO NOT include any markdown formatting (\`\`\`json) in your output. Output RAW JSON ONLY.
10. Ensure all HTML is valid: proper DOCTYPE, head, body, closing tags.
11. Escaping Strings: Be extremely careful with quotes in your JS code. Use backticks (\`) for strings that contain single quotes (like \`It's a draw!\`) to avoid breaking the JSON encoding and causing "missing ) after argument list" JS syntax errors.
12. Formatting: Format the HTML, CSS, and JS code beautifully with proper indentation and newlines (\`\\n\`). Do NOT minify the code into a single line.`;
  }

  /**
   * User prompt for initial generation.
   */
  public static buildUserPrompt(prompt: string): string {
    return `Generate a complete web application for the following request:
"${prompt}"

Remember: output exactly 3 files (index.html, style.css, script.js) as a JSON object.
The application must be fully functional and visually polished.
Output RAW JSON ONLY.`;
  }

  /**
   * Repair prompt for failed validation.
   */
  public static buildRepairPrompt(originalJson: string, errors: CodeValidationError[]): string {
    return `Your previous output failed validation. Fix the following errors and return the ENTIRE corrected JSON.

Errors:
${JSON.stringify(errors, null, 2)}

Original JSON:
${originalJson}

Requirements:
- Output exactly 3 files: index.html, style.css, script.js
- index.html must link to style.css and script.js
- All HTML must be valid with proper DOCTYPE, head, body
- No external CDN links or libraries
- Escaping Strings: Use backticks (\`) for JS strings that contain single quotes (like \`It's a draw!\`) to avoid breaking JSON and causing "missing ) after argument list" JS errors.
- Formatting: Format the HTML, CSS, and JS code beautifully with proper indentation and newlines (\`\\n\`). Do NOT minify the code into a single line.
- Output RAW JSON ONLY.`;
  }
}
