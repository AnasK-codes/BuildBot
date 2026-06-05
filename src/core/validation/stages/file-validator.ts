// ============================================================
// BuildBot — Stage 2: File Validator
// ============================================================
// Verifies the parsed JSON has the correct file structure:
// - files array is present and non-empty
// - Required files exist (index.html, style.css, script.js)
// - No duplicate or suspicious paths
// - Total size is within limits
// ============================================================

import { CodeValidationContext, CodeValidationStage } from '@/types/project.types';

const REQUIRED_FILES = ['index.html', 'style.css', 'script.js'];
const MAX_TOTAL_SIZE_BYTES = 500 * 1024; // 500KB total

export class FileValidator implements CodeValidationStage {
  name = 'file_validation';

  validate(context: CodeValidationContext): void {
    const parsed = context.data as any;

    // Check top-level structure
    if (!parsed || typeof parsed !== 'object') {
      context.issues.push({
        stage: this.name,
        severity: 'error',
        message: 'Parsed output must be a JSON object',
      });
      context.haltPipeline = true;
      return;
    }

    // Check files array
    if (!Array.isArray(parsed.files) || parsed.files.length === 0) {
      context.issues.push({
        stage: this.name,
        severity: 'error',
        message: 'Output must contain a non-empty "files" array',
      });
      context.haltPipeline = true;
      return;
    }

    // Validate each file has path and content
    for (let i = 0; i < parsed.files.length; i++) {
      const file = parsed.files[i];
      if (!file.path || typeof file.path !== 'string') {
        context.issues.push({
          stage: this.name,
          severity: 'error',
          message: `File at index ${i} is missing a valid "path" string`,
        });
      }
      if (typeof file.content !== 'string') {
        context.issues.push({
          stage: this.name,
          severity: 'error',
          message: `File "${file.path || i}" is missing a valid "content" string`,
          file: file.path,
        });
      }
    }

    // Check for required files
    const filePaths = new Set(parsed.files.map((f: any) => f.path));
    for (const required of REQUIRED_FILES) {
      if (!filePaths.has(required)) {
        context.issues.push({
          stage: this.name,
          severity: 'error',
          message: `Missing required file: ${required}`,
          file: required,
        });
      }
    }

    // Check for duplicate paths
    if (filePaths.size !== parsed.files.length) {
      context.issues.push({
        stage: this.name,
        severity: 'error',
        message: 'Duplicate file paths detected',
      });
    }

    // Check for suspicious paths (directory traversal)
    for (const file of parsed.files) {
      if (file.path && (file.path.includes('..') || file.path.startsWith('/'))) {
        context.issues.push({
          stage: this.name,
          severity: 'error',
          message: `Suspicious file path detected: "${file.path}"`,
          file: file.path,
        });
      }
    }

    // Check total size
    const totalSize = parsed.files.reduce((sum: number, f: any) => {
      return sum + (typeof f.content === 'string' ? Buffer.byteLength(f.content, 'utf-8') : 0);
    }, 0);

    if (totalSize > MAX_TOTAL_SIZE_BYTES) {
      context.issues.push({
        stage: this.name,
        severity: 'error',
        message: `Total file size (${totalSize} bytes) exceeds limit of ${MAX_TOTAL_SIZE_BYTES} bytes`,
      });
    }

    // Halt if any errors were found in this stage
    if (context.issues.some(i => i.stage === this.name && i.severity === 'error')) {
      context.haltPipeline = true;
    }
  }
}
