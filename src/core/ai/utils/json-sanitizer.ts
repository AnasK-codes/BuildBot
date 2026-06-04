import { createModuleLogger } from '@/lib/logger';

const log = createModuleLogger('json-sanitizer');

/**
 * Strips markdown wrapping (e.g. ```json ... ```) from a raw string
 * returned by an LLM and trims whitespace to ensure a clean JSON string.
 */
export function sanitizeJsonResponse(raw: string): string {
  if (!raw) return raw;

  let clean = raw.trim();

  // Check if it's wrapped in markdown
  const hasMarkdown = /^```(?:json|javascript)?/i.test(clean) || /```$/i.test(clean);

  if (hasMarkdown) {
    clean = clean.replace(/^```(?:json|javascript)?\s*/i, '');
    clean = clean.replace(/\s*```$/i, '');
    clean = clean.trim();
    log.debug('Sanitized markdown wrapping from JSON response');
  }

  return clean;
}
