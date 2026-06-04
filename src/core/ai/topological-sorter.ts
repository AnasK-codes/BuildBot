// ============================================================
// BuildBot — Topological Sorter
// ============================================================
// Sorts entities so that parents (targets of belongsTo relations)
// are seeded before their children.
// ============================================================

import { AppDefinition, EntityDefinition } from '@/types/metadata.types';

export class TopologicalSorter {
  public static sortEntities(appDef: AppDefinition): EntityDefinition[] {
    const entities = appDef.entities;
    const sorted: EntityDefinition[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const getEntity = (id: string) => entities.find(e => e.id === id);

    const visit = (entity: EntityDefinition) => {
      if (visited.has(entity.id)) return;
      if (visiting.has(entity.id)) {
        // Cyclic dependency detected, just return to avoid infinite loop
        return;
      }

      visiting.add(entity.id);

      // Find all belongsTo dependencies. 
      // If this entity has a belongsTo, the target must be created FIRST.
      entity.fields.forEach(f => {
        if (f.type === 'relation' && f.relation?.type === 'belongsTo') {
          const target = getEntity(f.relation.entityId);
          if (target) {
            visit(target);
          }
        }
      });

      visiting.delete(entity.id);
      visited.add(entity.id);
      sorted.push(entity);
    };

    entities.forEach(e => visit(e));
    return sorted;
  }
}
