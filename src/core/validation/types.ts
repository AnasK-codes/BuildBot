// ============================================================
// BuildBot — Validation Context & Interface
// ============================================================
// Core interfaces for the validation pipeline.
// ============================================================

import { ValidationIssue } from '@/types/metadata.types';

export interface ValidationContext {
  // Can be a string (Stage 1), parsed unknown (Stage 2), or AppDefinition (Stage 3+)
  data: unknown;
  issues: ValidationIssue[];
  // If a stage fails critically, it sets this to true to stop the pipeline
  haltPipeline: boolean;
}

export interface ValidationStage {
  name: string;
  validate(context: ValidationContext): Promise<void> | void;
}
