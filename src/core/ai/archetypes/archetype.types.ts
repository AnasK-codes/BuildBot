// ============================================================
// BuildBot — Archetype Types
// ============================================================

export type ArchetypeType = 
  | 'CRM'
  | 'INVENTORY'
  | 'PROJECT_MANAGEMENT'
  | 'HR'
  | 'ERP'
  | 'ECOMMERCE'
  | 'BOOKING'
  | 'CUSTOM';

export interface ArchetypeDetectionResult {
  type: ArchetypeType;
  confidence: number;
}

export interface ArchetypeTemplate {
  type: ArchetypeType;
  description: string;
  recommendedEntities: string[];
  recommendedRelations: string[];
}
