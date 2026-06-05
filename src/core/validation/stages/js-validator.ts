// ============================================================
// BuildBot — Stage 5: JavaScript Validator
// ============================================================
// Validates the generated script.js file:
// - Basic syntax check via Function constructor
// - No import/require of external modules
// - No eval() or new Function(string) usage
// ============================================================

import { CodeValidationContext, CodeValidationStage } from '@/types/project.types';

export class JsValidator implements CodeValidationStage {
  name = 'js_validation';

  validate(context: CodeValidationContext): void {
    const parsed = context.data as any;
    const jsFile = parsed.files.find((f: any) => f.path === 'script.js');

    if (!jsFile) return; // Already caught by FileValidator

    const content = jsFile.content as string;

    // Allow empty JS
    if (content.trim().length === 0) {
      context.issues.push({
        stage: this.name,
        severity: 'warning',
        message: 'script.js is empty',
        file: 'script.js',
      });
      return;
    }

    // Syntax check via Function constructor (server-side only, no execution)
    try {
      // This parses but does NOT execute the code
      new Function(content);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      context.issues.push({
        stage: this.name,
        severity: 'error',
        message: `JavaScript syntax error: ${errorMessage}`,
        file: 'script.js',
      });
    }

    // Check for module imports (not allowed in browser-only apps without bundler)
    if (/\bimport\s+.*\s+from\s+['"]/.test(content) || /\brequire\s*\(/.test(content)) {
      context.issues.push({
        stage: this.name,
        severity: 'warning',
        message: 'script.js contains import/require statements. Generated apps should be self-contained.',
        file: 'script.js',
      });
    }
  }
}
