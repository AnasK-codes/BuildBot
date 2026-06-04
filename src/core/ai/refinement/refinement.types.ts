// ============================================================
// BuildBot — Refinement Types
// ============================================================

import { AppDefinition } from '@/types/metadata.types';
import { AppUIDefinition } from '@/types/ui-metadata.types';
import { SchemaEvolutionReport, SchemaChange } from '@/core/evolution/evolution.types';

export interface RefinementRequest {
  appId: string;
  instruction: string;
}

export interface RefinementResult {
  originalDefinition: AppDefinition;
  refinedDefinition: AppDefinition;
  evolutionReport: SchemaEvolutionReport;
  uiDefinition: AppUIDefinition;
  newVersion: number;
  appId: string;
}

export interface RefinementPreview {
  addedEntities: string[];
  removedEntities: string[];
  addedFields: { entity: string; field: string }[];
  removedFields: { entity: string; field: string }[];
  renamedEntities: { from: string; to: string }[];
  renamedFields: { entity: string; from: string; to: string }[];
  relationshipChanges: string[];
  safeChanges: number;
  warnings: number;
  breakingChanges: number;
  evolutionReport: SchemaEvolutionReport;
}

export interface RefinementImpact {
  hasBreakingChanges: boolean;
  totalChanges: number;
  highestSeverity: 'SAFE' | 'WARNING' | 'BREAKING';
  requiresReview: boolean;
}
