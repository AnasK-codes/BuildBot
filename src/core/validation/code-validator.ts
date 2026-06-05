// ============================================================
// BuildBot — Code Validator Orchestrator
// ============================================================
// Executes the multi-stage validation pipeline on generated code.
// Refactored from the original ValidationEngine — same pipeline
// runner pattern, new stages for HTML/CSS/JS validation.
// ============================================================

import {
  CodeValidationContext,
  CodeValidationStage,
  CodeValidationReport,
  CodeValidationError,
  CodeValidationWarning,
} from '@/types/project.types';
import { JsonParseStage } from './stages/json-validator';
import { FileValidator } from './stages/file-validator';
import { HtmlValidator } from './stages/html-validator';
import { CssValidator } from './stages/css-validator';
import { JsValidator } from './stages/js-validator';
import { CodeSanitizer } from './stages/code-sanitizer';

export class CodeValidator {
  private stages: CodeValidationStage[] = [
    new JsonParseStage(),
    new FileValidator(),
    new HtmlValidator(),
    new CssValidator(),
    new JsValidator(),
    new CodeSanitizer(),
  ];

  /**
   * Run the validation pipeline on a raw JSON string from the AI.
   */
  public validate(rawJson: string): CodeValidationReport {
    const context: CodeValidationContext = {
      data: rawJson,
      issues: [],
      haltPipeline: false,
    };

    let stageReached = 'init';

    for (const stage of this.stages) {
      stageReached = stage.name;
      try {
        stage.validate(context);
      } catch (error) {
        context.issues.push({
          stage: stage.name,
          severity: 'error',
          message: `Unexpected error during ${stage.name}: ${error instanceof Error ? error.message : String(error)}`,
        });
        context.haltPipeline = true;
      }

      if (context.haltPipeline) {
        break;
      }
    }

    return this.buildReport(context, stageReached);
  }

  private buildReport(context: CodeValidationContext, stageReached: string): CodeValidationReport {
    const errors = context.issues.filter((i): i is CodeValidationError => i.severity === 'error');
    const warnings = context.issues.filter((i): i is CodeValidationWarning => i.severity === 'warning');

    // Count file-level stats if we got past the file validation stage
    let filesProcessed = 0;
    let invalidFiles = 0;

    if (!context.haltPipeline || stageReached !== 'json_parse' && stageReached !== 'file_validation') {
      const parsed = context.data as any;
      if (parsed && Array.isArray(parsed.files)) {
        filesProcessed = parsed.files.length;
        const filesWithErrors = new Set(errors.filter(e => e.file).map(e => e.file));
        invalidFiles = filesWithErrors.size;
      }
    }

    const securityIssues = errors.filter(e => e.stage === 'security_sanitizer').length
      + warnings.filter(w => w.stage === 'security_sanitizer').length;

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      summary: {
        filesProcessed,
        validFiles: filesProcessed - invalidFiles,
        invalidFiles,
        stageReached,
        securityIssues,
      },
    };
  }
}
