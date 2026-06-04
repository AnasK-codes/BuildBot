// ============================================================
// BuildBot — Intent Classifier
// ============================================================

import { ArchetypeDetectionResult, ArchetypeType } from './archetype.types';

export class IntentClassifier {
  // Keyword scoring weights
  private static keywordMap: Record<string, ArchetypeType> = {
    'crm': 'CRM',
    'sales': 'CRM',
    'leads': 'CRM',
    'customer relationship': 'CRM',
    'deals': 'CRM',
    
    'inventory': 'INVENTORY',
    'stock': 'INVENTORY',
    'warehouse': 'INVENTORY',
    'tracking system': 'INVENTORY',
    
    'project management': 'PROJECT_MANAGEMENT',
    'tasks': 'PROJECT_MANAGEMENT',
    'projects': 'PROJECT_MANAGEMENT',
    'kanban': 'PROJECT_MANAGEMENT',
    
    'ecommerce': 'ECOMMERCE',
    'e-commerce': 'ECOMMERCE',
    'store': 'ECOMMERCE',
    'shop': 'ECOMMERCE',
    'orders': 'ECOMMERCE',
    
    'hr': 'HR',
    'human resources': 'HR',
    'employees': 'HR',
    'payroll': 'HR',
    
    'erp': 'ERP',
    'enterprise': 'ERP',
    
    'booking': 'BOOKING',
    'reservations': 'BOOKING',
    'appointments': 'BOOKING'
  };

  /**
   * Detects the archetype based on lightweight keyword scoring.
   */
  public static detectArchetype(prompt: string): ArchetypeDetectionResult {
    const normalizedPrompt = prompt.toLowerCase();
    const scores: Partial<Record<ArchetypeType, number>> = {};

    for (const [keyword, type] of Object.entries(this.keywordMap)) {
      if (normalizedPrompt.includes(keyword)) {
        // Longer/multi-word keywords carry slightly more weight
        const weight = keyword.includes(' ') ? 1.5 : 1.0;
        scores[type] = (scores[type] || 0) + weight;
      }
    }

    let maxScore = 0;
    let detectedType: ArchetypeType = 'CUSTOM';

    for (const [type, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        detectedType = type as ArchetypeType;
      }
    }

    // Convert raw score to confidence (capped at 1.0)
    // Example: 1 keyword hit (score 1.0) = 0.75 confidence.
    let confidence = 0;
    if (maxScore > 0) {
      confidence = Math.min(0.6 + (maxScore * 0.15), 1.0);
    }

    return {
      type: detectedType,
      confidence
    };
  }
}
