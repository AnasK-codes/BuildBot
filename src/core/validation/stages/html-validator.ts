// ============================================================
// BuildBot — Stage 3: HTML Validator
// ============================================================
// Validates the generated index.html file:
// - Contains DOCTYPE and basic structure
// - References style.css and script.js
// - No external CDN links
// ============================================================

import { CodeValidationContext, CodeValidationStage } from '@/types/project.types';

export class HtmlValidator implements CodeValidationStage {
  name = 'html_validation';

  validate(context: CodeValidationContext): void {
    const parsed = context.data as any;
    const htmlFile = parsed.files.find((f: any) => f.path === 'index.html');

    if (!htmlFile) return; // Already caught by FileValidator

    const content = htmlFile.content as string;

    // Check for DOCTYPE
    if (!content.match(/<!DOCTYPE\s+html>/i)) {
      context.issues.push({
        stage: this.name,
        severity: 'warning',
        message: 'index.html is missing <!DOCTYPE html> declaration',
        file: 'index.html',
      });
    }

    // Check for <html> tag
    if (!content.match(/<html[\s>]/i)) {
      context.issues.push({
        stage: this.name,
        severity: 'error',
        message: 'index.html is missing <html> tag',
        file: 'index.html',
      });
    }

    // Check for <head> and <body>
    if (!content.match(/<head[\s>]/i)) {
      context.issues.push({
        stage: this.name,
        severity: 'error',
        message: 'index.html is missing <head> section',
        file: 'index.html',
      });
    }

    if (!content.match(/<body[\s>]/i)) {
      context.issues.push({
        stage: this.name,
        severity: 'error',
        message: 'index.html is missing <body> section',
        file: 'index.html',
      });
    }

    // Check for style.css reference
    if (!content.match(/<link[^>]*href=["']style\.css["'][^>]*>/i) &&
        !content.match(/<link[^>]*href=["']\.\/style\.css["'][^>]*>/i)) {
      context.issues.push({
        stage: this.name,
        severity: 'error',
        message: 'index.html does not reference style.css. Expected: <link rel="stylesheet" href="style.css">',
        file: 'index.html',
      });
    }

    // Check for script.js reference
    if (!content.match(/<script[^>]*src=["']script\.js["'][^>]*>/i) &&
        !content.match(/<script[^>]*src=["']\.\/script\.js["'][^>]*>/i)) {
      context.issues.push({
        stage: this.name,
        severity: 'error',
        message: 'index.html does not reference script.js. Expected: <script src="script.js"></script>',
        file: 'index.html',
      });
    }

    // Check for external CDN scripts (not allowed)
    const externalScriptPattern = /<script[^>]*src=["'](https?:\/\/[^"']+)["'][^>]*>/gi;
    let match;
    while ((match = externalScriptPattern.exec(content)) !== null) {
      context.issues.push({
        stage: this.name,
        severity: 'error',
        message: `External script not allowed: ${match[1]}`,
        file: 'index.html',
      });
    }

    // Check for external CSS links (not allowed)
    const externalCssPattern = /<link[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>/gi;
    while ((match = externalCssPattern.exec(content)) !== null) {
      context.issues.push({
        stage: this.name,
        severity: 'error',
        message: `External stylesheet not allowed: ${match[1]}`,
        file: 'index.html',
      });
    }
  }
}
