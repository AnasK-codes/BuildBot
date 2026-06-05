// ============================================================
// BuildBot — Stage 6: Code Sanitizer (Security)
// ============================================================
// Scans generated JS and HTML for dangerous patterns that
// could escape the sandbox or access platform resources.
// This is a defense-in-depth layer — the iframe sandbox
// attributes provide the primary isolation.
// ============================================================

import { CodeValidationContext, CodeValidationStage } from '@/types/project.types';

interface BlockedPattern {
  pattern: RegExp;
  message: string;
  severity: 'error' | 'warning';
}

const BLOCKED_JS_PATTERNS: BlockedPattern[] = [
  {
    pattern: /\beval\s*\(/g,
    message: 'eval() is not allowed for security reasons',
    severity: 'warning',
  },
  {
    pattern: /new\s+Function\s*\(/g,
    message: 'new Function() is not allowed for security reasons',
    severity: 'warning',
  },
  {
    pattern: /document\.cookie/gi,
    message: 'document.cookie access is not allowed',
    severity: 'warning',
  },
  {
    pattern: /\bwindow\.(parent|top|opener)\b/gi,
    message: 'Accessing window.parent/top/opener is not allowed',
    severity: 'warning',
  },
  {
    pattern: /\bpostMessage\s*\(/g,
    message: 'postMessage() is not allowed for sandbox security',
    severity: 'warning',
  },
];

const BLOCKED_HTML_PATTERNS: BlockedPattern[] = [
  {
    pattern: /<iframe[\s>]/gi,
    message: 'Nested <iframe> elements are not allowed',
    severity: 'warning',
  },
  {
    pattern: /javascript\s*:/gi,
    message: 'javascript: URLs are not allowed',
    severity: 'warning',
  },
];

export class CodeSanitizer implements CodeValidationStage {
  name = 'security_sanitizer';

  validate(context: CodeValidationContext): void {
    const parsed = context.data as any;

    // Scan JavaScript
    const jsFile = parsed.files.find((f: any) => f.path === 'script.js');
    if (jsFile && jsFile.content) {
      this.scanContent(context, jsFile.content, 'script.js', BLOCKED_JS_PATTERNS);
    }

    // Scan HTML for inline scripts and dangerous patterns
    const htmlFile = parsed.files.find((f: any) => f.path === 'index.html');
    if (htmlFile && htmlFile.content) {
      this.scanContent(context, htmlFile.content, 'index.html', BLOCKED_HTML_PATTERNS);

      // Also scan inline script content in HTML for JS patterns
      const inlineScriptPattern = /<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi;
      let match;
      while ((match = inlineScriptPattern.exec(htmlFile.content)) !== null) {
        if (match[1] && match[1].trim().length > 0) {
          this.scanContent(context, match[1], 'index.html (inline script)', BLOCKED_JS_PATTERNS);
        }
      }
    }
  }

  private scanContent(
    context: CodeValidationContext,
    content: string,
    fileName: string,
    patterns: BlockedPattern[]
  ): void {
    for (const blocked of patterns) {
      // Reset lastIndex for global regex
      blocked.pattern.lastIndex = 0;
      if (blocked.pattern.test(content)) {
        context.issues.push({
          stage: this.name,
          severity: blocked.severity,
          message: `[${fileName}] ${blocked.message}`,
          file: fileName,
        });
      }
    }
  }
}
