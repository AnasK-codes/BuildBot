import { sanitizeJsonResponse } from '@/core/ai/utils/json-sanitizer';

describe('sanitizeJsonResponse', () => {
  it('should return raw string if no markdown is present', () => {
    const raw = '{"test": 123}';
    expect(sanitizeJsonResponse(raw)).toBe(raw);
  });

  it('should trim whitespace', () => {
    const raw = '   {"test": 123}   \n';
    expect(sanitizeJsonResponse(raw)).toBe('{"test": 123}');
  });

  it('should strip ```json blocks', () => {
    const raw = '```json\n{"test": 123}\n```';
    expect(sanitizeJsonResponse(raw)).toBe('{"test": 123}');
  });

  it('should strip ```javascript blocks', () => {
    const raw = '```javascript\n{"test": 123}\n```';
    expect(sanitizeJsonResponse(raw)).toBe('{"test": 123}');
  });

  it('should strip plain ``` blocks', () => {
    const raw = '```\n{"test": 123}\n```';
    expect(sanitizeJsonResponse(raw)).toBe('{"test": 123}');
  });

  it('should handle leading whitespace before markdown', () => {
    const raw = '   \n```json\n{"test": 123}\n```\n  ';
    expect(sanitizeJsonResponse(raw)).toBe('{"test": 123}');
  });

  it('should handle missing trailing newline in markdown', () => {
    const raw = '```json\n{"test": 123}```';
    expect(sanitizeJsonResponse(raw)).toBe('{"test": 123}');
  });

  it('should return empty string if null or empty', () => {
    expect(sanitizeJsonResponse('')).toBe('');
  });
});
