// ============================================================
// BuildBot — Query Builder
// ============================================================
// Translates standardized QueryOptions into Prisma JSONB queries.
// Safely ignores unknown fields and enforces pagination limits.
// ============================================================

import { QueryOptions, RuntimeContext, FilterCondition, SortCondition } from '@/types/runtime.types';
import { Prisma } from '@prisma/client';
import { EntityDefinition, FieldDefinition } from '@/types/metadata.types';
import { ValidationError } from '@/core/errors';

export class QueryBuilder {
  /**
   * Build Prisma findMany args from QueryOptions
   */
  public buildPrismaArgs(context: RuntimeContext, options: QueryOptions): Prisma.RuntimeRecordFindManyArgs {
    const where = this.buildWhereClause(context, options.filters);
    const orderBy = this.buildOrderBy(context.entity, options.sort);
    
    // Enforce pagination limits
    const limit = Math.min(Math.max(options.pagination.limit, 1), 100);
    const cursor = options.pagination.cursor;

    return {
      where,
      orderBy,
      take: limit + 1, // +1 to check for hasMore
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // Skip the cursor itself
      }),
    };
  }

  public buildCountArgs(context: RuntimeContext, options: QueryOptions): Prisma.RuntimeRecordCountArgs {
    return {
      where: this.buildWhereClause(context, options.filters),
    };
  }

  private buildWhereClause(context: RuntimeContext, filters: FilterCondition[]): Prisma.RuntimeRecordWhereInput {
    // 1. Enforce strict base isolation (Security Rule: Ownership enforced at every layer)
    const baseWhere: Prisma.RuntimeRecordWhereInput = {
      appId: context.app.id,
      userId: context.user.userId,
      entitySlug: context.entity.name.toLowerCase(),
      isDeleted: false,
    };

    if (!filters || filters.length === 0) {
      return baseWhere;
    }

    // 2. Build dynamic JSONB filters
    const validFields = new Map<string, FieldDefinition>(
      context.entity.fields.map(f => [f.name, f])
    );

    const andConditions: Prisma.RuntimeRecordWhereInput[] = [baseWhere];

    for (const filter of filters) {
      const fieldDef = validFields.get(filter.field);
      
      // Ignore filters on unknown fields
      if (!fieldDef) {
        continue;
      }

      // Special handling for system fields (id, createdAt, updatedAt)
      if (filter.field === 'id') {
        andConditions.push({ id: filter.value as string });
        continue;
      }

      // JSONB data filtering
      const jsonFilter = this.mapOperatorToPrismaJson(filter.operator, filter.value, fieldDef.type);
      if (jsonFilter) {
        andConditions.push({
          data: {
            path: [filter.field],
            ...jsonFilter
          }
        });
      }
    }

    // Combine conditions
    return andConditions.length > 1 ? { AND: andConditions } : baseWhere;
  }

  private buildOrderBy(entity: EntityDefinition, sort?: SortCondition): Prisma.RuntimeRecordOrderByWithRelationInput {
    if (!sort) {
      return { createdAt: 'desc' }; // Default sort
    }

    // Special handling for system fields
    if (['createdAt', 'updatedAt', 'id'].includes(sort.field)) {
      return { [sort.field]: sort.order };
    }

    // Verify field exists in entity metadata
    const fieldExists = entity.fields.some(f => f.name === sort.field);
    if (!fieldExists) {
      return { createdAt: 'desc' }; // Fallback to safe default if field unknown
    }

    // In Prisma, sorting by a specific JSON path isn't natively supported 
    // across all DBs without raw queries. For Phase 3, we map it as best effort 
    // or fallback to createdAt. Real-world JSONB sorting requires specific cast raw queries.
    // To keep it simple and safe for this phase:
    return { createdAt: 'desc' };
  }

  private mapOperatorToPrismaJson(operator: string, value: unknown, fieldType: string): any {
    // Prisma JSON filtering syntax
    switch (operator) {
      case 'equals':
        return { equals: value };
      case 'notEquals':
        return { not: value };
      case 'gt':
        return { gt: value };
      case 'gte':
        return { gte: value };
      case 'lt':
        return { lt: value };
      case 'lte':
        return { lte: value };
      case 'contains':
        if (fieldType === 'string' || fieldType === 'text') {
          return { string_contains: value as string };
        }
        return undefined;
      default:
        return undefined;
    }
  }
}

export const queryBuilder = new QueryBuilder();
