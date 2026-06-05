// ============================================================
// BuildBot — Project Types (C1: Website Generator)
// ============================================================

// --- Generated File Data (used in pipeline before persistence) ---

export interface GeneratedFileData {
  path: string;       // "index.html" | "style.css" | "script.js"
  content: string;
  language: string;   // "html" | "css" | "javascript"
  sizeBytes: number;
  checksum: string;   // SHA-256 hash
}

// --- AI Output Shape ---

export interface AIGenerationOutput {
  title: string;
  files: Array<{
    path: string;
    content: string;
  }>;
}

// --- Code Validation Types ---

export type CodeValidationSeverity = 'error' | 'warning';

export interface CodeValidationIssue {
  stage: string;
  severity: CodeValidationSeverity;
  message: string;
  file?: string;
  line?: number;
  details?: Record<string, unknown>;
}

export interface CodeValidationError extends CodeValidationIssue {
  severity: 'error';
}

export interface CodeValidationWarning extends CodeValidationIssue {
  severity: 'warning';
}

export interface CodeValidationReport {
  valid: boolean;
  errors: CodeValidationError[];
  warnings: CodeValidationWarning[];
  summary: {
    filesProcessed: number;
    validFiles: number;
    invalidFiles: number;
    stageReached: string;
    securityIssues: number;
  };
}

// --- Generation Result ---

export interface GenerationResult {
  title: string;
  files: GeneratedFileData[];
  validationReport: CodeValidationReport;
  success: boolean;
}

// --- Validation Pipeline Interfaces ---

export interface CodeValidationContext {
  /** Starts as raw string (stage 1), becomes parsed object after JSON parse */
  data: unknown;
  issues: CodeValidationIssue[];
  haltPipeline: boolean;
}

export interface CodeValidationStage {
  name: string;
  validate(context: CodeValidationContext): Promise<void> | void;
}

// --- Project Status ---

export type ProjectStatus = 'GENERATING' | 'READY' | 'ERROR';
export type VersionStatus = 'VALID' | 'INVALID' | 'GENERATING';
