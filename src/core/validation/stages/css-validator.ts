// ============================================================
// BuildBot — Stage 4: CSS Validator
// ============================================================
// Validates the generated style.css file:
// - Balanced braces
// - No @import of external URLs
// - No url() references to external domains
// - Basic structural checks
// ============================================================

import { CodeValidationContext, CodeValidationStage } from '@/types/project.types';

export class CssValidator implements CodeValidationStage {
  name = 'css_validation';

  validate(context: CodeValidationContext): void {
    const parsed = context.data as any;
    const cssFile = parsed.files.find((f: any) => f.path === 'style.css');

    if (!cssFile) return; // Already caught by FileValidator

    const content = cssFile.content as string;

    // Allow empty CSS (some apps are JS-heavy)
    if (content.trim().length === 0) {
      context.issues.push({
        stage: this.name,
        severity: 'warning',
        message: 'style.css is empty',
        file: 'style.css',
      });
      return;
    }

    // Check for balanced braces
    let braceDepth = 0;
    for (const char of content) {
      if (char === '{') braceDepth++;
      if (char === '}') braceDepth--;
      if (braceDepth < 0) {
        context.issues.push({
          stage: this.name,
          severity: 'error',
          message: 'style.css has unbalanced braces: extra closing brace }',
          file: 'style.css',
        });
        break;
      }
    }
    if (braceDepth > 0) {
      context.issues.push({
        stage: this.name,
        severity: 'error',
        message: `style.css has ${braceDepth} unclosed brace(s)`,
        file: 'style.css',
      });
    }

    // Check for @import of external URLs
    const importPattern = /@import\s+(?:url\()?["']?(https?:\/\/[^"')\s]+)["']?\)?/gi;
    let match;
    while ((match = importPattern.exec(content)) !== null) {
      context.issues.push({
        stage: this.name,
        severity: 'error',
        message: `External @import not allowed: ${match[1]}`,
        file: 'style.css',
      });
    }

    // Check for url() references to external domains
    const urlPattern = /url\(\s*["']?(https?:\/\/[^"')\s]+)["']?\s*\)/gi;
    while ((match = urlPattern.exec(content)) !== null) {
      context.issues.push({
        stage: this.name,
        severity: 'warning',
        message: `External URL reference: ${match[1]}. Consider using local resources.`,
        file: 'style.css',
      });
    }
  }
}
